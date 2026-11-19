-- Painel de interações: registra leituras (artigos, revista, colunas) e downloads (revista).
-- Visitantes sem conta também contam; o registro passa sempre pela função registrar_evento.

CREATE TABLE IF NOT EXISTS public.eventos_conteudo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_conteudo text NOT NULL CHECK (tipo_conteudo IN ('artigo', 'revista', 'coluna')),
  slug text NOT NULL CHECK (char_length(slug) BETWEEN 1 AND 200),
  evento text NOT NULL CHECK (evento IN ('leitura', 'download')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_conteudo_slug ON public.eventos_conteudo (slug, evento);
CREATE INDEX IF NOT EXISTS idx_eventos_conteudo_data ON public.eventos_conteudo (created_at DESC);

ALTER TABLE public.eventos_conteudo ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.eventos_conteudo FROM anon, authenticated;
GRANT SELECT ON public.eventos_conteudo TO authenticated;
GRANT ALL ON public.eventos_conteudo TO service_role;

CREATE POLICY "Admin le eventos de conteudo" ON public.eventos_conteudo
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Único caminho de escrita: valida os valores e grava quem leu (ou nulo, para visitantes).
CREATE OR REPLACE FUNCTION public.registrar_evento(_tipo text, _slug text, _evento text)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _tipo NOT IN ('artigo', 'revista', 'coluna')
     OR _evento NOT IN ('leitura', 'download')
     OR _slug IS NULL OR char_length(_slug) NOT BETWEEN 1 AND 200
     OR (_evento = 'download' AND _tipo <> 'revista') THEN
    RAISE EXCEPTION 'Evento invalido';
  END IF;
  INSERT INTO public.eventos_conteudo (tipo_conteudo, slug, evento, user_id)
  VALUES (_tipo, _slug, _evento, auth.uid());
END;
$$;
REVOKE ALL ON FUNCTION public.registrar_evento(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_evento(text, text, text) TO anon, authenticated;

-- Totais por conteúdo para o painel. Só devolve linhas para a administração.
CREATE OR REPLACE FUNCTION public.painel_interacoes(_desde timestamptz DEFAULT NULL)
RETURNS TABLE(
  slug text,
  leituras bigint,
  downloads bigint,
  curtidas bigint,
  salvos bigint,
  comentarios bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ev AS (
    SELECT e.slug AS s,
           count(*) FILTER (WHERE e.evento = 'leitura') AS l,
           count(*) FILTER (WHERE e.evento = 'download') AS d
    FROM public.eventos_conteudo e
    WHERE _desde IS NULL OR e.created_at >= _desde
    GROUP BY e.slug
  ),
  it AS (
    SELECT i.publicacao_slug AS s,
           count(*) FILTER (WHERE i.tipo = 'curtida') AS c,
           count(*) FILTER (WHERE i.tipo = 'salvo') AS v
    FROM public.interacoes i
    WHERE _desde IS NULL OR i.created_at >= _desde
    GROUP BY i.publicacao_slug
  ),
  co AS (
    SELECT c.publicacao_slug AS s, count(*) AS n
    FROM public.comentarios c
    WHERE _desde IS NULL OR c.created_at >= _desde
    GROUP BY c.publicacao_slug
  ),
  todos AS (
    SELECT s FROM ev UNION SELECT s FROM it UNION SELECT s FROM co
  )
  SELECT t.s,
         COALESCE(ev.l, 0)::bigint,
         COALESCE(ev.d, 0)::bigint,
         COALESCE(it.c, 0)::bigint,
         COALESCE(it.v, 0)::bigint,
         COALESCE(co.n, 0)::bigint
  FROM todos t
  LEFT JOIN ev ON ev.s = t.s
  LEFT JOIN it ON it.s = t.s
  LEFT JOIN co ON co.s = t.s
  WHERE public.has_role(auth.uid(), 'admin'::public.app_role)
$$;
REVOKE ALL ON FUNCTION public.painel_interacoes(timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.painel_interacoes(timestamptz) TO authenticated;
-- O Supabase dá EXECUTE ao anon por padrão em funções novas; o painel é só para contas.
REVOKE EXECUTE ON FUNCTION public.painel_interacoes(timestamptz) FROM anon;
