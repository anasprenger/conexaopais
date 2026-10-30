CREATE TABLE public.solicitacoes_profissional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo text NOT NULL,
  telefone text NOT NULL,
  email text NOT NULL,
  profissao text NOT NULL,
  registro_profissional text NOT NULL,
  endereco text NOT NULL,
  rede_social text,
  foto_url text,
  status text NOT NULL DEFAULT 'pendente',
  observacao_admin text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.solicitacoes_profissional TO authenticated;
GRANT ALL ON public.solicitacoes_profissional TO service_role;

ALTER TABLE public.solicitacoes_profissional ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada um cria sua solicitacao"
ON public.solicitacoes_profissional FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Ve a propria solicitacao ou admin ve todas"
ON public.solicitacoes_profissional FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin atualiza solicitacoes"
ON public.solicitacoes_profissional FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_solicitacoes_profissional_updated_at
BEFORE UPDATE ON public.solicitacoes_profissional
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();