DROP POLICY IF EXISTS "Perfis sao publicos" ON public.profiles;
CREATE POLICY "Proprio perfil ou admin le dados completos"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.public_profiles(_ids uuid[] DEFAULT NULL, _display_name text DEFAULT NULL)
RETURNS TABLE(id uuid, display_name text, bio text, avatar_url text, especialidade text, profissao text, verificacao text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.bio, p.avatar_url, p.especialidade, p.profissao, p.verificacao
  FROM public.profiles p
  WHERE (_ids IS NULL OR p.id = ANY(_ids))
    AND (_display_name IS NULL OR p.display_name = _display_name)
    AND p.status = 'ativo'
$$;
REVOKE ALL ON FUNCTION public.public_profiles(uuid[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_profiles(uuid[], text) TO anon, authenticated;

DROP POLICY IF EXISTS "Conteudos ocultos sao publicos" ON public.conteudos_ocultos;
CREATE POLICY "Admin le detalhes de conteudos ocultos"
ON public.conteudos_ocultos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.public_hidden_content()
RETURNS TABLE(tipo text, slug text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.tipo, c.slug FROM public.conteudos_ocultos c
$$;
REVOKE ALL ON FUNCTION public.public_hidden_content() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_hidden_content() TO anon, authenticated;

DROP POLICY IF EXISTS "Interacoes sao publicas para contagem" ON public.interacoes;
CREATE POLICY "Proprias interacoes ou admin"
ON public.interacoes FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Curtidas de comentario sao publicas" ON public.comentario_curtidas;
CREATE POLICY "Cada um le suas curtidas de comentario"
ON public.comentario_curtidas FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.comment_like_summary(_comment_ids uuid[])
RETURNS TABLE(comentario_id uuid, total bigint, liked_by_me boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT requested.comentario_id,
         count(cc.id)::bigint AS total,
         bool_or(cc.user_id = auth.uid()) AS liked_by_me
  FROM unnest(_comment_ids) AS requested(comentario_id)
  LEFT JOIN public.comentario_curtidas cc ON cc.comentario_id = requested.comentario_id
  GROUP BY requested.comentario_id
$$;
REVOKE ALL ON FUNCTION public.comment_like_summary(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.comment_like_summary(uuid[]) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.ranking_interacoes(_tipo public.tipo_interacao, _limite integer DEFAULT 5)
RETURNS TABLE(publicacao_slug text, total bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.publicacao_slug, count(*)::bigint AS total
  FROM public.interacoes i
  WHERE i.tipo = _tipo
  GROUP BY i.publicacao_slug
  ORDER BY total DESC, i.publicacao_slug
  LIMIT LEAST(GREATEST(COALESCE(_limite, 5), 1), 50)
$$;
REVOKE ALL ON FUNCTION public.ranking_interacoes(public.tipo_interacao, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ranking_interacoes(public.tipo_interacao, integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.ranking_comentarios(_limite integer DEFAULT 5)
RETURNS TABLE(id uuid, texto text, publicacao_slug text, autor text, total bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.texto, c.publicacao_slug,
         COALESCE(p.display_name, 'Participante') AS autor,
         count(cc.id)::bigint AS total
  FROM public.comentarios c
  LEFT JOIN public.profiles p ON p.id = c.user_id
  LEFT JOIN public.comentario_curtidas cc ON cc.comentario_id = c.id
  GROUP BY c.id, c.texto, c.publicacao_slug, p.display_name
  ORDER BY total DESC, c.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(_limite, 5), 1), 50)
$$;
REVOKE ALL ON FUNCTION public.ranking_comentarios(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ranking_comentarios(integer) TO anon, authenticated;

DROP POLICY IF EXISTS "Qualquer um envia contato" ON public.contact_messages;
REVOKE INSERT ON public.contact_messages FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_contact_message(text, text, text, text) TO anon, authenticated;