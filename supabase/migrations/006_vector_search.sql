-- RPC used by the RAG layer to find chunks nearest to a query embedding.
create or replace function public.match_guidance_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count     int   default 6
)
returns table (
  id              uuid,
  document_id     uuid,
  guidance_id     uuid,
  content         text,
  similarity      float,
  document_title  text,
  guidance_category text,
  guidance_source text,
  last_verified   timestamptz
)
language plpgsql stable security definer set search_path = public
as $$
begin
  return query
  select
    gc.id,
    gc.document_id,
    g.id as guidance_id,
    gc.content,
    (1 - (gc.embedding <=> query_embedding))::float as similarity,
    g.title as document_title,
    g.category as guidance_category,
    g.source as guidance_source,
    g.last_verified
  from public.guidance_chunks gc
  join public.guidance g on g.id = gc.guidance_id
  where gc.embedding is not null
    and g.status = 'approved'
    and (1 - (gc.embedding <=> query_embedding)) > match_threshold
  order by gc.embedding <=> query_embedding
  limit match_count;
end;
$$;

grant execute on function public.match_guidance_chunks to anon, authenticated, service_role;
