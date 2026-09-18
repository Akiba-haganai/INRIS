-- RPC used by the RAG layer to find chunks nearest to a query embedding.
create or replace function public.match_guidance_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count     int   default 6
)
returns table (
  id              uuid,
  document_id     uuid,
  content         text,
  similarity      float,
  document_title  text
)
language plpgsql stable security definer set search_path = public
as $$
begin
  return query
  select
    gc.id,
    gc.document_id,
    gc.content,
    (1 - (gc.embedding <=> query_embedding))::float as similarity,
    d.title as document_title
  from public.guidance_chunks gc
  join public.documents d on d.id = gc.document_id
  where gc.embedding is not null
    and d.status = 'ready'
    and (1 - (gc.embedding <=> query_embedding)) > match_threshold
  order by gc.embedding <=> query_embedding
  limit match_count;
end;
$$;

grant execute on function public.match_guidance_chunks to anon, authenticated, service_role;
