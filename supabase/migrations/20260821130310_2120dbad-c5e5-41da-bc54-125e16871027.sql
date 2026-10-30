-- 1. profiles: profissão / registro / verificação
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profissao text,
  ADD COLUMN IF NOT EXISTS registro_profissional text,
  ADD COLUMN IF NOT EXISTS verificacao text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS verificado_em timestamptz,
  ADD COLUMN IF NOT EXISTS verificado_por uuid;

-- 2. publicacoes
CREATE TYPE public.tipo_publicacao AS ENUM ('artigo', 'post', 'revista', 'coluna');
CREATE TYPE public.status_publicacao AS ENUM ('rascunho', 'publicado');

CREATE TABLE public.publicacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.tipo_publicacao NOT NULL,
  slug text NOT NULL UNIQUE,
  titulo text NOT NULL,
  resumo text,
  conteudo text,
  categoria text,
  capa_url text,
  pdf_url text,
  autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.status_publicacao NOT NULL DEFAULT 'publicado',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.publicacoes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publicacoes TO authenticated;
GRANT ALL ON public.publicacoes TO service_role;
ALTER TABLE public.publicacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publicadas sao publicas" ON public.publicacoes
  FOR SELECT TO anon, authenticated USING (status = 'publicado');
CREATE POLICY "Autor ve as proprias" ON public.publicacoes
  FOR SELECT TO authenticated USING (autor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin e profissional aprovado criam" ON public.publicacoes
  FOR INSERT TO authenticated WITH CHECK (
    autor_id = auth.uid() AND (
      public.has_role(auth.uid(), 'admin')
      OR (
        public.has_role(auth.uid(), 'profissional')
        AND tipo IN ('artigo', 'post')
        AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.verificacao = 'aprovado')
      )
    )
  );
CREATE POLICY "Autor ou admin edita" ON public.publicacoes
  FOR UPDATE TO authenticated
  USING (autor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (autor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Autor ou admin remove" ON public.publicacoes
  FOR DELETE TO authenticated USING (autor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_publicacoes_updated_at BEFORE UPDATE ON public.publicacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. interacoes
CREATE TYPE public.tipo_interacao AS ENUM ('curtida', 'salvo', 'lido');

CREATE TABLE public.interacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  publicacao_slug text NOT NULL,
  tipo public.tipo_interacao NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, publicacao_slug, tipo)
);

GRANT SELECT ON public.interacoes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interacoes TO authenticated;
GRANT ALL ON public.interacoes TO service_role;
ALTER TABLE public.interacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Interacoes sao publicas para contagem" ON public.interacoes
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Cada um cria suas interacoes" ON public.interacoes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Cada um remove suas interacoes" ON public.interacoes
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 4. comentarios
CREATE TABLE public.comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  publicacao_slug text NOT NULL,
  texto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.comentarios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comentarios TO authenticated;
GRANT ALL ON public.comentarios TO service_role;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentarios sao publicos" ON public.comentarios
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Cada um comenta" ON public.comentarios
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Cada um edita seu comentario" ON public.comentarios
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Autor ou admin apaga comentario" ON public.comentarios
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_comentarios_updated_at BEFORE UPDATE ON public.comentarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.comentario_curtidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comentario_id uuid NOT NULL REFERENCES public.comentarios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comentario_id, user_id)
);

GRANT SELECT ON public.comentario_curtidas TO anon;
GRANT SELECT, INSERT, DELETE ON public.comentario_curtidas TO authenticated;
GRANT ALL ON public.comentario_curtidas TO service_role;
ALTER TABLE public.comentario_curtidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Curtidas de comentario sao publicas" ON public.comentario_curtidas
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Cada um curte comentario" ON public.comentario_curtidas
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Cada um descurte comentario" ON public.comentario_curtidas
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 5. rankings
CREATE OR REPLACE FUNCTION public.ranking_interacoes(_tipo public.tipo_interacao, _limite integer DEFAULT 5)
RETURNS TABLE (publicacao_slug text, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.publicacao_slug, count(*)::bigint AS total
  FROM public.interacoes i
  WHERE i.tipo = _tipo
  GROUP BY i.publicacao_slug
  ORDER BY total DESC, i.publicacao_slug
  LIMIT COALESCE(_limite, 5)
$$;

CREATE OR REPLACE FUNCTION public.ranking_comentarios(_limite integer DEFAULT 5)
RETURNS TABLE (id uuid, texto text, publicacao_slug text, autor text, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
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

REVOKE ALL ON FUNCTION public.ranking_interacoes(public.tipo_interacao, integer) FROM public;
REVOKE ALL ON FUNCTION public.ranking_comentarios(integer) FROM public;
GRANT EXECUTE ON FUNCTION public.ranking_interacoes(public.tipo_interacao, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ranking_comentarios(integer) TO anon, authenticated, service_role;