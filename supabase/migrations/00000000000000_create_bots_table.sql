-- Create bots table
create table if not exists public.bots (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    default_language text not null default 'en',
    greeting text,
    is_active boolean not null default true
);
-- Enable RLS
alter table public.bots enable row level security;
-- Create policies
create policy "Users can create their own bots" on public.bots for
insert with check (auth.uid() = user_id);
create policy "Users can view their own bots" on public.bots for
select using (auth.uid() = user_id);
create policy "Users can update their own bots" on public.bots for
update using (auth.uid() = user_id);
create policy "Users can delete their own bots" on public.bots for delete using (auth.uid() = user_id);
-- Create updated_at trigger
create or replace function public.handle_updated_at() returns trigger language plpgsql security definer as $$ begin new.updated_at = timezone('utc'::text, now());
return new;
end;
$$;
create trigger handle_bots_updated_at before
update on public.bots for each row execute function public.handle_updated_at();