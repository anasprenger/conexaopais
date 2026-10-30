CREATE OR REPLACE FUNCTION public.ranking_interacoes(_tipo public.tipo_interacao, _limite integer DEFAULT 5)
RETURNS TABLE (publicacao_slug text, total bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT i.publicacao_slug, count(*)::bigint AS total
  FROM public.interacoes i
  WHERE i.tipo = _tipo
  GROUP BY i.publicacao_slug
  ORDER BY total DESC, i.publicacao_slug
  LIMIT COALESCE(_limite, 5)
$$;

CREATE OR REPLACE FUNCTION public.ranking_comentarios(_limite integer DEFAULT 5)
RETURNS TABLE (id uuid, texto text, publicacao_slug text, autor text, total bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT c.id, c.texto, c.publicacao_slug,
         COALESCE(p.display_name, 'Participante') AS autor,
         count(cc.id)::bigint AS total
  FROM public.comentarios c
  LEFT JOIN public.profiles p ON p.id = c.user_id
  LEFT JOIN public.comentario_curtidas cc ON cc.comentario_id = c.id
  GROUP BY c.id, c.texto, c.publicacao_slug, p.display_name
  ORDER BY total DESC, c.created_at DESC
  LIMIT COALESCE(_limite, 5)
$$;