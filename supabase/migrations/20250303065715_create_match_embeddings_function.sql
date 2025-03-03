-- Create a function to match embeddings using cosine similarity
create or replace function match_embeddings(
        query_embedding vector(1536),
        match_count int,
        bot_id uuid
    ) returns table (
        content text,
        similarity float,
        source_id uuid,
        metadata jsonb
    ) language plpgsql as $$ begin return query
select e.content,
    1 - (e.embedding <=> query_embedding) as similarity,
    e.source_id,
    e.metadata
from embeddings e
where e.bot_id = match_embeddings.bot_id
order by e.embedding <=> query_embedding
limit match_count;
end;
$$;