create table jobs (
  id uuid primary key default gen_random_uuid(),
  owner text not null,
  status text not null default 'queued',  -- queued | running | done | failed
  prompt text, negative text, duration int, aspect text, resolution text,
  status_url text, response_url text, video_url text, error text,
  created_at timestamptz default now()
);
create index on jobs(owner, created_at desc);
alter table jobs enable row level security;  -- no policies: only the server (service role) can access
