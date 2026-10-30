GRANT SELECT ON public.publicacoes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publicacoes TO authenticated;
GRANT ALL ON public.publicacoes TO service_role;