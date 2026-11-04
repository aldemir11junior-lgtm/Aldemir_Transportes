-- ─────────────────────────────────────────────────────────────────────────
-- SEGURANÇA DO BANCO: LOGIN POR FUNÇÃO + SESSÃO + RLS POR PERFIL
-- ─────────────────────────────────────────────────────────────────────────
-- Substitui as políticas antigas "acesso_total_anon" (que deixavam qualquer
-- pessoa com a anon key ler/alterar/apagar tudo, inclusive os hashes de senha).
--
-- Como funciona:
--   1. O site chama login_app(usuario, senha_hash). Se estiver certo, o banco
--      cria uma sessão e devolve um token.
--   2. O site manda o token no cabeçalho "x-sessao-token" em toda requisição.
--   3. As políticas RLS só liberam as tabelas se o token for de uma sessão
--      válida; exclusões definitivas e cadastros só para o perfil "gerente".
--   4. A tabela "usuarios" não tem mais nenhum acesso direto: só via funções.
--
-- ANTES DE RODAR: exporte os dados (Table Editor → Export to CSV).
-- RODE ESTE SCRIPT INTEIRO: Supabase → SQL Editor → New query → Run.
-- Não apaga nem altera dados existentes (as senhas continuam as mesmas).
--
-- ATENÇÃO: qualquer outro sistema que use a anon key neste banco (ex.: o app
-- Streamlit/app.py) deixa de ter acesso. Ele precisa usar a service_role key.
-- ─────────────────────────────────────────────────────────────────────────

-- ─── Tabelas de apoio ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessoes (
  token      text PRIMARY KEY,
  usuario_id bigint NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_em  timestamptz NOT NULL DEFAULT now(),
  expira_em  timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS login_tentativas (
  id      bigserial PRIMARY KEY,
  usuario text NOT NULL,
  quando  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_tentativas_idx ON login_tentativas (usuario, quando);

ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_tentativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE motoristas ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE carretas ENABLE ROW LEVEL SECURITY;
ALTER TABLE viagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE abastecimentos ENABLE ROW LEVEL SECURITY;

-- Sem política = ninguém (anon/authenticated) acessa direto.
REVOKE ALL ON sessoes, login_tentativas, usuarios FROM anon, authenticated;

-- ─── Quem está chamando? (lê o token do cabeçalho) ───────────────────────
CREATE OR REPLACE FUNCTION public.sessao_usuario_id() RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT s.usuario_id
  FROM sessoes s
  WHERE s.token = (current_setting('request.headers', true)::json ->> 'x-sessao-token')
    AND s.expira_em > now()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.sessao_perfil() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT u.perfil::text
  FROM usuarios u
  WHERE u.id = public.sessao_usuario_id()
$$;

GRANT EXECUTE ON FUNCTION public.sessao_usuario_id(), public.sessao_perfil() TO anon, authenticated;

-- ─── LOGIN / LOGOUT ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.login_app(p_usuario text, p_senha_hash text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_usuario text := lower(trim(coalesce(p_usuario, '')));
  v_user    usuarios%ROWTYPE;
  v_token   text;
BEGIN
  DELETE FROM sessoes WHERE expira_em < now();
  DELETE FROM login_tentativas WHERE quando < now() - interval '1 day';

  IF (SELECT count(*) FROM login_tentativas
      WHERE usuario = v_usuario AND quando > now() - interval '10 minutes') >= 5 THEN
    RAISE EXCEPTION 'Muitas tentativas. Aguarde 10 minutos e tente novamente.';
  END IF;

  SELECT * INTO v_user FROM usuarios WHERE usuario = v_usuario;
  IF NOT FOUND OR v_user.senha_hash IS DISTINCT FROM lower(coalesce(p_senha_hash, '')) THEN
    INSERT INTO login_tentativas (usuario) VALUES (v_usuario);
    RETURN NULL;
  END IF;

  DELETE FROM login_tentativas WHERE usuario = v_usuario;
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  INSERT INTO sessoes (token, usuario_id, expira_em)
  VALUES (v_token, v_user.id, now() + interval '24 hours');

  RETURN jsonb_build_object('token', v_token, 'id', v_user.id, 'nome', v_user.nome,
                            'usuario', v_user.usuario, 'perfil', v_user.perfil);
END $$;

CREATE OR REPLACE FUNCTION public.logout_app() RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  DELETE FROM sessoes
  WHERE token = (current_setting('request.headers', true)::json ->> 'x-sessao-token')
$$;

-- ─── GESTÃO DE USUÁRIOS (somente gerente) ────────────────────────────────
CREATE OR REPLACE FUNCTION public.exigir_gerente() RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF coalesce(public.sessao_perfil(), '') <> 'gerente' THEN
    RAISE EXCEPTION 'Sem permissão.';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.listar_usuarios_app() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.exigir_gerente();
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id', u.id, 'nome', u.nome, 'usuario', u.usuario, 'perfil', u.perfil)
                                    ORDER BY u.nome) FROM usuarios u), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.buscar_usuario_app(p_id bigint) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.exigir_gerente();
  RETURN (SELECT jsonb_build_object('id', u.id, 'nome', u.nome, 'usuario', u.usuario, 'perfil', u.perfil)
          FROM usuarios u WHERE u.id = p_id);
END $$;

CREATE OR REPLACE FUNCTION public.usuario_login_existe_app(p_usuario text, p_excluir_id bigint DEFAULT NULL) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.exigir_gerente();
  RETURN EXISTS (SELECT 1 FROM usuarios
                 WHERE usuario = lower(trim(p_usuario)) AND (p_excluir_id IS NULL OR id <> p_excluir_id));
END $$;

CREATE OR REPLACE FUNCTION public.criar_usuario_app(p_nome text, p_usuario text, p_perfil text, p_senha_hash text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.exigir_gerente();
  IF p_perfil NOT IN ('gerente', 'operacional') THEN RAISE EXCEPTION 'Perfil inválido.'; END IF;
  IF coalesce(p_senha_hash, '') = '' THEN RAISE EXCEPTION 'Senha obrigatória.'; END IF;
  INSERT INTO usuarios (nome, usuario, perfil, senha_hash)
  VALUES (p_nome, lower(trim(p_usuario)), p_perfil, lower(p_senha_hash));
END $$;

CREATE OR REPLACE FUNCTION public.atualizar_usuario_app(p_id bigint, p_nome text, p_usuario text, p_perfil text, p_senha_hash text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.exigir_gerente();
  IF p_perfil NOT IN ('gerente', 'operacional') THEN RAISE EXCEPTION 'Perfil inválido.'; END IF;
  UPDATE usuarios
     SET nome = p_nome, usuario = lower(trim(p_usuario)), perfil = p_perfil,
         senha_hash = coalesce(lower(nullif(p_senha_hash, '')), senha_hash)
   WHERE id = p_id;
  -- Trocou a senha: derruba as sessões abertas desse usuário.
  IF coalesce(p_senha_hash, '') <> '' THEN DELETE FROM sessoes WHERE usuario_id = p_id; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.excluir_usuario_app(p_id bigint) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.exigir_gerente();
  IF p_id = public.sessao_usuario_id() THEN RAISE EXCEPTION 'Você não pode excluir o próprio usuário.'; END IF;
  DELETE FROM usuarios WHERE id = p_id;
END $$;

GRANT EXECUTE ON FUNCTION
  public.login_app(text, text), public.logout_app(), public.listar_usuarios_app(),
  public.buscar_usuario_app(bigint), public.usuario_login_existe_app(text, bigint),
  public.criar_usuario_app(text, text, text, text),
  public.atualizar_usuario_app(bigint, text, text, text, text),
  public.excluir_usuario_app(bigint)
TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.exigir_gerente() FROM anon, authenticated, public;

-- ─── POLÍTICAS DAS TABELAS DE DADOS ──────────────────────────────────────
-- Ler/inserir/alterar: qualquer sessão válida.
-- Apagar de vez motoristas, veículos e carretas: só gerente.
-- Apagar de vez viagens/abastecimentos: só o que já está na lixeira
-- (gerente a qualquer momento; limpeza automática de itens com +15 dias para todos).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['motoristas','veiculos','carretas','viagens','abastecimentos'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "acesso_total_anon" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "sessao_select" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "sessao_insert" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "sessao_update" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "sessao_delete" ON %I', t);
    EXECUTE format('CREATE POLICY "sessao_select" ON %I FOR SELECT TO anon, authenticated USING (public.sessao_usuario_id() IS NOT NULL)', t);
    EXECUTE format('CREATE POLICY "sessao_insert" ON %I FOR INSERT TO anon, authenticated WITH CHECK (public.sessao_usuario_id() IS NOT NULL)', t);
    EXECUTE format('CREATE POLICY "sessao_update" ON %I FOR UPDATE TO anon, authenticated USING (public.sessao_usuario_id() IS NOT NULL) WITH CHECK (public.sessao_usuario_id() IS NOT NULL)', t);
  END LOOP;
END $$;

CREATE POLICY "sessao_delete" ON motoristas FOR DELETE TO anon, authenticated USING (public.sessao_perfil() = 'gerente');
CREATE POLICY "sessao_delete" ON veiculos   FOR DELETE TO anon, authenticated USING (public.sessao_perfil() = 'gerente');
CREATE POLICY "sessao_delete" ON carretas   FOR DELETE TO anon, authenticated USING (public.sessao_perfil() = 'gerente');
CREATE POLICY "sessao_delete" ON viagens FOR DELETE TO anon, authenticated USING (
  public.sessao_usuario_id() IS NOT NULL AND excluido_em IS NOT NULL
  AND (public.sessao_perfil() = 'gerente' OR excluido_em < now() - interval '15 days'));
CREATE POLICY "sessao_delete" ON abastecimentos FOR DELETE TO anon, authenticated USING (
  public.sessao_usuario_id() IS NOT NULL AND excluido_em IS NOT NULL
  AND (public.sessao_perfil() = 'gerente' OR excluido_em < now() - interval '15 days'));

-- Só o gerente pode mandar para a lixeira / restaurar (igual aos botões da tela).
-- session_user é "authenticator" nas chamadas da API e "postgres" no SQL Editor,
-- então o SQL Editor continua livre para manutenção.
CREATE OR REPLACE FUNCTION public.proteger_excluido_em() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF session_user IN ('authenticator', 'anon', 'authenticated') AND NEW.excluido_em IS DISTINCT FROM OLD.excluido_em
     AND coalesce(public.sessao_perfil(), '') <> 'gerente' THEN
    RAISE EXCEPTION 'Somente o gerente pode excluir ou restaurar.';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_proteger_excluido_em ON viagens;
CREATE TRIGGER trg_proteger_excluido_em BEFORE UPDATE ON viagens
  FOR EACH ROW EXECUTE FUNCTION public.proteger_excluido_em();
DROP TRIGGER IF EXISTS trg_proteger_excluido_em ON abastecimentos;
CREATE TRIGGER trg_proteger_excluido_em BEFORE UPDATE ON abastecimentos
  FOR EACH ROW EXECUTE FUNCTION public.proteger_excluido_em();
