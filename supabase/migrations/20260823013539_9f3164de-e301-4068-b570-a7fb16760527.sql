CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _tipo text := COALESCE(NEW.raw_user_meta_data ->> 'tipo_conta', 'usuario');
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, profissao, registro_profissional, verificacao)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'profissao',
    NEW.raw_user_meta_data ->> 'registro_profissional',
    CASE WHEN _tipo = 'profissional' THEN 'pendente' ELSE 'aprovado' END
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN _tipo = 'profissional' THEN 'profissional'::app_role ELSE 'usuario'::app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

UPDATE public.profiles SET verificacao = 'aprovado' WHERE verificacao = 'pendente';