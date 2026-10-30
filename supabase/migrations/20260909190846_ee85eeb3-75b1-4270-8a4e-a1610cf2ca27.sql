CREATE TABLE public.conteudos_ocultos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  slug text NOT NULL,
  titulo text NOT NULL,
  justificativa text,
  ocultado_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tipo, slug)
);

GRANT SELECT ON public.conteudos_ocultos TO anon;
GRANT SELECT, INSERT, DELETE ON public.conteudos_ocultos TO authenticated;
GRANT ALL ON public.conteudos_ocultos TO service_role;

ALTER TABLE public.conteudos_ocultos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conteudos ocultos sao publicos" ON public.conteudos_ocultos
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admin oculta conteudo" ON public.conteudos_ocultos
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND ocultado_por = auth.uid());

CREATE POLICY "Admin restaura conteudo" ON public.conteudos_ocultos
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));