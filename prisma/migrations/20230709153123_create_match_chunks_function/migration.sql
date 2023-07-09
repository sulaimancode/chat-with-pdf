CREATE OR REPLACE FUNCTION match_chunks(
    vectorQuery vector,
    documentId text
)
RETURNS TABLE (
    id TEXT,
    page INTEGER,
    content TEXT,
    token_count INTEGER,
    document_id TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    chunk.id,
    chunk.page,
    chunk.content,
    chunk.token_count,
    chunk.document_id,
    1 - (chunk.embedding <=> vectorQuery) as similarity
  FROM chunk
  WHERE chunk.document_id = documentId
  AND 1 - (chunk.embedding <=> vectorQuery) > .5
  ORDER BY similarity DESC;

  RETURN;
END;
$$;
