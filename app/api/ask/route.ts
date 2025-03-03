import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { OpenAIEmbeddings } from "@langchain/openai"
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

interface RelevantChunk {
  similarity: number
  content: string
  source_id: string
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize OpenAI embeddings
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    // Get the current user from Supabase auth
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const { botId, question } = await request.json()
    if (!botId || !question) {
      return NextResponse.json({ error: 'Missing botId or question' }, { status: 400 })
    }

    // Verify the user has access to this bot
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('id')
      .eq('id', botId)
      .eq('user_id', user.id)
      .single()

    if (botError || !bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    // Get embedding for the question
    const [questionEmbedding] = await embeddings.embedDocuments([question])

    // Find relevant content using vector similarity search
    const { data: relevantChunks, error: searchError } = await supabase
      .rpc('match_embeddings', {
        query_embedding: questionEmbedding,
        match_count: 5, // Get top 5 matches
        bot_id: botId
      })

    if (searchError) {
      console.error('Search error:', searchError)
      return NextResponse.json({ error: 'Failed to search knowledge base' }, { status: 500 })
    }

    // Set a higher similarity threshold for more relevant matches
    const SIMILARITY_THRESHOLD = 0.85

    // Get relevant chunks that meet the similarity threshold
    const filteredChunks = relevantChunks?.filter((chunk: RelevantChunk) => chunk.similarity > SIMILARITY_THRESHOLD)

    // If no relevant content found
    if (!filteredChunks?.length) {
      return NextResponse.json({ 
        answer: "I apologize, but I don't have enough specific information in my knowledge base to answer that question accurately. I can only provide information that is directly contained in my training documents.",
        sources: []
      })
    }

    // Get source filenames
    const { data: sources } = await supabase
      .from('sources')
      .select('id, name')
      .in('id', filteredChunks.map((chunk: RelevantChunk) => chunk.source_id))

    console.log('All chunks with similarities:', 
      filteredChunks.map((chunk: RelevantChunk) => ({
        similarity: chunk.similarity,
        content: chunk.content.substring(0, 100) + '...' // First 100 chars for readability
      }))
    )
    console.log('Filtered chunks:', 
      filteredChunks.map((c: RelevantChunk) => ({
        similarity: c.similarity,
        content: c.content.substring(0, 100) + '...'
      }))
    )
    console.log('Sources:', sources)

    const sourceMap = new Map(sources?.map(s => [s.id, s.name]) || [])

    // Construct context from relevant chunks
    const context = filteredChunks
      .map((chunk: RelevantChunk) => chunk.content)
      .join('\n\n')

    // Construct the messages array for the chat completion
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are a helpful AI assistant that ONLY answers questions based on the provided context. 
        If the context doesn't contain enough specific information to answer the question accurately and completely, 
        respond with: "I apologize, but I don't have enough specific information in my knowledge base to answer that question accurately. 
        I can only provide information that is directly contained in my training documents."
        
        NEVER make up or infer information that isn't explicitly present in the context.
        NEVER use your general knowledge to answer questions.
        ONLY use information that is directly provided in the context.
        
        Format your responses using HTML for better readability:
        - Use <h2> for main headers
        - Use <h3> for subsections
        - Use <strong> for emphasis
        - Use <ul> and <li> for unordered lists
        - Use <ol> and <li> for ordered lists
        
        Here is the context to use for answering the question:
        
        ${context}`
      },
      {
        role: 'user',
        content: question
      }
    ] as const

    // Get completion from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.1, // Lower temperature for more precise answers
      max_tokens: 500
    })

    // Return the answer and sources
    return NextResponse.json({
      answer: completion.choices[0].message.content,
      sources: filteredChunks
        .map((chunk: RelevantChunk) => ({
          content: chunk.content,
          similarity: chunk.similarity,
          filename: sourceMap.get(chunk.source_id) || 'Unknown source'
        }))
    })

  } catch (error) {
    console.error('Error in ask endpoint:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
} 