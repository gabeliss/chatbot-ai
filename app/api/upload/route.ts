import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { OpenAIEmbeddings } from "@langchain/openai"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize OpenAI embeddings
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
})

// Configure chunk size and overlap for text splitting
const CHUNK_SIZE = 1500
const CHUNK_OVERLAP = 150

export async function POST(request: Request) {
  try {
    console.log('Starting file upload process...')
    
    // Get the current user from Supabase auth
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('User authenticated:', user.id)

    // Parse the multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const botId = formData.get('botId') as string

    if (!file || !botId) {
      console.error('Missing required fields:', { file: !!file, botId: !!botId })
      return NextResponse.json({ error: 'Missing file or botId' }, { status: 400 })
    }
    console.log('File received:', { name: file.name, type: file.type, size: file.size })

    // Validate file type
    const fileType = file.type.toLowerCase()
    const validTypes = ['application/pdf', 'text/plain', 'text/markdown']
    if (!validTypes.includes(fileType)) {
      console.error('Invalid file type:', fileType)
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    console.log('Creating source record...')
    // Create a source record
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        bot_id: botId,
        user_id: user.id,
        name: file.name,
        type: fileType === 'application/pdf' ? 'pdf' : 
              fileType === 'text/markdown' ? 'markdown' : 'text',
        size: file.size,
        status: 'processing'
      })
      .select()
      .single()

    if (sourceError || !source) {
      console.error('Failed to create source record:', sourceError)
      return NextResponse.json({ error: 'Failed to create source record' }, { status: 500 })
    }
    console.log('Source record created:', source.id)

    // Extract text from the file
    console.log('Extracting text from file...')
    let text = ''
    if (fileType === 'application/pdf') {
      // For PDFs, use PDFLoader
      const buffer = Buffer.from(await file.arrayBuffer())
      const loader = new PDFLoader(new Blob([buffer]))
      const docs = await loader.load()
      text = docs.map((doc: { pageContent: string }) => doc.pageContent).join('\n')
      console.log('PDF text extracted, length:', text.length)
    } else {
      // For text files, read directly
      text = await file.text()
      console.log('Text file content loaded, length:', text.length)
    }

    // Split text into chunks
    console.log('Splitting text into chunks...')
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    })
    const chunks = await splitter.createDocuments([text])
    console.log('Text split into chunks:', chunks.length)

    // Process each chunk
    console.log('Processing chunks and generating embeddings...')
    for (const chunk of chunks) {
      try {
        // Get embeddings using LangChain's OpenAIEmbeddings
        const [embedding] = await embeddings.embedDocuments([chunk.pageContent])
        console.log('Generated embedding for chunk, length:', embedding.length)

        // Store the chunk and its embedding
        const { error: embeddingError } = await supabase
          .from('embeddings')
          .insert({
            source_id: source.id,
            bot_id: botId,
            content: chunk.pageContent,
            embedding: embedding,
            metadata: chunk.metadata
          })

        if (embeddingError) {
          console.error('Error storing embedding:', embeddingError)
          throw embeddingError
        }
        console.log('Stored embedding in database')
      } catch (error) {
        console.error('Error processing chunk:', error)
        throw error
      }
    }

    // Update source status to completed
    console.log('Updating source status to completed...')
    await supabase
      .from('sources')
      .update({ status: 'completed' })
      .eq('id', source.id)

    console.log('File processing completed successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Upload processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
} 