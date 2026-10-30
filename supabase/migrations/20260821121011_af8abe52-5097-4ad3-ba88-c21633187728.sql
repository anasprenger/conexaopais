ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS especialidade text;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role FROM auth.users u WHERE u.email = 'admin@conexaopais.test'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'profissional'::app_role FROM auth.users u WHERE u.email = 'profissional@conexaopais.test'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'usuario'::app_role FROM auth.users u WHERE u.email = 'familia@conexaopais.test'
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE public.profiles p
SET especialidade = 'Psicologia infantil', whatsapp = '5551999990001',
    bio = 'Psicóloga infantil, atende famílias há 15 anos com foco em vínculo e regulação emocional.'
FROM auth.users u
WHERE u.id = p.id AND u.email = 'profissional@conexaopais.test';