-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;
-- Create a table for storing document sources
create table if not exists sources (
    id uuid primary key default gen_random_uuid(),
    bot_id uuid not null references bots(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    type text not null check (type in ('pdf', 'text', 'markdown')),
    size integer not null,
    -- file size in bytes
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    status text not null default 'pending' check (
        status in ('pending', 'processing', 'completed', 'error')
    ),
    error text -- stores error message if processing fails
);
-- Create a table for storing text chunks and their embeddings
create table if not exists embeddings (
    id uuid primary key default gen_random_uuid(),
    source_id uuid not null references sources(id) on delete cascade,
    bot_id uuid not null references bots(id) on delete cascade,
    content text not null,
    embedding vector(1536),
    -- OpenAI embeddings are 1536 dimensions
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    metadata jsonb -- optional metadata about the chunk (e.g., page number, section, etc.)
);
-- Create an index for similarity search
create index on embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);
-- Create policies to control access
create policy "Users can insert their own sources" on sources for
insert with check (auth.uid() = user_id);
create policy "Users can view their own sources" on sources for
select using (auth.uid() = user_id);
create policy "Users can update their own sources" on sources for
update using (auth.uid() = user_id);
create policy "Users can delete their own sources" on sources for delete using (auth.uid() = user_id);
create policy "Users can insert embeddings for their sources" on embeddings for
insert with check (
        exists (
            select 1
            from sources
            where sources.id = embeddings.source_id
                and sources.user_id = auth.uid()
        )
    );
create policy "Users can view embeddings for their sources" on embeddings for
select using (
        exists (
            select 1
            from sources
            where sources.id = embeddings.source_id
                and sources.user_id = auth.uid()
        )
    );
create policy "Users can delete embeddings for their sources" on embeddings for delete using (
    exists (
        select 1
        from sources
        where sources.id = embeddings.source_id
            and sources.user_id = auth.uid()
    )
);