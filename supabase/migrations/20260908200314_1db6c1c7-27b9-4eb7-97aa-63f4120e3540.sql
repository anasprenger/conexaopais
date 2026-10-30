CREATE TABLE public.remocoes_publicacao (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publicacao_id uuid NOT NULL,
  titulo text NOT NULL,
  tipo text NOT NULL,
  slug text NOT NULL,
  autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  removido_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  justificativa text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.remocoes_publicacao TO authenticated;
GRANT ALL ON public.remocoes_publicacao TO service_role;

ALTER TABLE public.remocoes_publicacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin registra remocao" ON public.remocoes_publicacao
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND removido_por = auth.uid());

CREATE POLICY "Autor ou admin ve remocao" ON public.remocoes_publicacao
  FOR SELECT TO authenticated
  USING (autor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_remocoes_autor ON public.remocoes_publicacao (autor_id, created_at DESC);