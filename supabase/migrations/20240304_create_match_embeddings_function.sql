-- Drop the existing function first
drop function if exists match_embeddings(vector(1536), int, uuid);
-- Create a function to match embeddings using cosine similarity
create or replace function match_embeddings(
        query_embedding vector(1536),
        match_count int,
        bot_id uuid
    ) returns table (
        content text,
        similarity float,
        source_id uuid
    ) language plpgsql as $$ begin return query
select embeddings.content,
    1 - (embeddings.embedding <=> query_embedding) as similarity,
    embeddings.source_id
from embeddings
where embeddings.bot_id = match_embeddings.bot_id
order by embeddings.embedding <=> query_embedding
limit match_count;
end;
$$;