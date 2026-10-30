ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz;

CREATE OR REPLACE FUNCTION public.protect_profile_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.verificacao IS DISTINCT FROM OLD.verificacao
      OR NEW.verificado_em IS DISTINCT FROM OLD.verificado_em
      OR NEW.verificado_por IS DISTINCT FROM OLD.verificado_por)
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Somente a administracao pode alterar a verificacao profissional';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_verification_fields ON public.profiles;
CREATE TRIGGER protect_profile_verification_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_verification_fields();

CREATE OR REPLACE FUNCTION public.submit_professional_request(
  _nome_completo text,
  _telefone text,
  _email text,
  _profissao text,
  _registro_profissional text,
  _endereco text,
  _rede_social text DEFAULT NULL,
  _foto_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _id uuid;
  _account_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Autenticacao obrigatoria'; END IF;
  IF _account_email = '' OR lower(trim(_email)) <> _account_email THEN
    RAISE EXCEPTION 'O email deve ser o mesmo da conta autenticada';
  END IF;
  IF length(trim(_nome_completo)) < 3 OR length(trim(_nome_completo)) > 120
     OR length(trim(_telefone)) < 8 OR length(trim(_telefone)) > 30
     OR length(trim(_profissao)) < 2 OR length(trim(_profissao)) > 100
     OR length(trim(_registro_profissional)) < 2 OR length(trim(_registro_profissional)) > 80
     OR length(trim(_endereco)) < 5 OR length(trim(_endereco)) > 300 THEN
    RAISE EXCEPTION 'Dados da solicitacao invalidos';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.solicitacoes_profissional
    WHERE user_id = _user_id AND status IN ('pendente', 'ajustes_solicitados')
  ) THEN
    RAISE EXCEPTION 'Ja existe uma solicitacao em analise';
  END IF;

  INSERT INTO public.solicitacoes_profissional (
    user_id, nome_completo, telefone, email, profissao,
    registro_profissional, endereco, rede_social, foto_url
  ) VALUES (
    _user_id, trim(_nome_completo), trim(_telefone), lower(trim(_email)), trim(_profissao),
    trim(_registro_profissional), trim(_endereco), nullif(trim(_rede_social), ''), _foto_url
  ) RETURNING id INTO _id;

  IF _foto_url IS NOT NULL THEN
    UPDATE public.profiles SET avatar_url = _foto_url WHERE id = _user_id;
  END IF;
  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_professional_request(text,text,text,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_professional_request(text,text,text,text,text,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.decide_professional_request(
  _request_id uuid,
  _status text,
  _observation text DEFAULT NULL
)
RETURNS TABLE(recipient_email text, recipient_name text, resulting_status text, observation text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _request public.solicitacoes_profissional%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  IF _status NOT IN ('aprovado', 'recusado', 'ajustes_solicitados') THEN
    RAISE EXCEPTION 'Decisao invalida';
  END IF;
  IF _status = 'ajustes_solicitados' AND (length(trim(coalesce(_observation, ''))) < 10 OR length(trim(_observation)) > 800) THEN
    RAISE EXCEPTION 'Informe uma orientacao entre 10 e 800 caracteres';
  END IF;

  SELECT * INTO _request
  FROM public.solicitacoes_profissional
  WHERE id = _request_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitacao nao encontrada'; END IF;
  IF _request.status = _status THEN RAISE EXCEPTION 'Esta decisao ja foi registrada'; END IF;

  UPDATE public.solicitacoes_profissional
  SET status = _status,
      observacao_admin = CASE WHEN _status = 'ajustes_solicitados' THEN trim(_observation) ELSE NULL END
  WHERE id = _request_id;

  IF _status = 'aprovado' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_request.user_id, 'profissional'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE public.profiles
    SET display_name = _request.nome_completo,
        profissao = _request.profissao,
        registro_profissional = _request.registro_profissional,
        whatsapp = _request.telefone,
        avatar_url = coalesce(_request.foto_url, avatar_url),
        verificacao = 'aprovado',
        verificado_em = now(),
        verificado_por = auth.uid()
    WHERE id = _request.user_id;
  ELSIF _status = 'recusado' THEN
    UPDATE public.profiles
    SET verificacao = 'recusado', verificado_em = now(), verificado_por = auth.uid()
    WHERE id = _request.user_id;
  ELSE
    UPDATE public.profiles
    SET verificacao = 'pendente', verificado_em = NULL, verificado_por = auth.uid()
    WHERE id = _request.user_id;
  END IF;

  RETURN QUERY SELECT _request.email, _request.nome_completo, _status,
    CASE WHEN _status = 'ajustes_solicitados' THEN trim(_observation) ELSE NULL END;
END;
$$;

REVOKE ALL ON FUNCTION public.decide_professional_request(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_professional_request(uuid,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_contact_message(
  _name text,
  _email text,
  _subject text,
  _message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _id uuid;
BEGIN
  IF length(trim(_name)) < 2 OR length(trim(_name)) > 120
     OR lower(trim(_email)) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
     OR length(trim(_message)) < 10 OR length(trim(_message)) > 5000
     OR length(coalesce(trim(_subject), '')) > 160 THEN
    RAISE EXCEPTION 'Dados de contato invalidos';
  END IF;
  IF (SELECT count(*) FROM public.contact_messages
      WHERE lower(email) = lower(trim(_email)) AND created_at > now() - interval '1 hour') >= 3 THEN
    RAISE EXCEPTION 'Limite de mensagens atingido. Tente novamente mais tarde';
  END IF;

  INSERT INTO public.contact_messages(name, email, subject, message)
  VALUES (trim(_name), lower(trim(_email)), nullif(trim(_subject), ''), trim(_message))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_contact_message(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_contact_message(text,text,text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_welcome_email()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _claimed boolean := false;
BEGIN
  IF auth.uid() IS NULL OR coalesce((auth.jwt() ->> 'email_confirmed_at')::timestamptz, now()) IS NULL THEN
    RETURN false;
  END IF;
  UPDATE public.profiles
  SET welcome_email_sent_at = now()
  WHERE id = auth.uid() AND welcome_email_sent_at IS NULL;
  GET DIAGNOSTICS _claimed = ROW_COUNT;
  RETURN _claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_welcome_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_welcome_email() TO authenticated;