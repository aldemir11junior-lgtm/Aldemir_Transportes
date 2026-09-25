-- ─────────────────────────────────────────────────────────────────────────
-- POLÍTICAS DE ACESSO (RLS) PARA O SITE HTML/CSS/JS
-- ─────────────────────────────────────────────────────────────────────────
-- Libera leitura/escrita nas tabelas JÁ EXISTENTES (usadas hoje pelo
-- Streamlit) para quem usa a anon key. O login continua sendo o mesmo
-- (usuario/senha_hash na tabela "usuarios") — não usa Supabase Auth.
--
-- Rode este script inteiro no Supabase em: SQL Editor → New query → Run.
-- Não apaga nem altera nenhum dado existente.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE motoristas ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE carretas ENABLE ROW LEVEL SECURITY;
ALTER TABLE viagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE abastecimentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "acesso_total_anon" ON usuarios;
DROP POLICY IF EXISTS "acesso_total_anon" ON motoristas;
DROP POLICY IF EXISTS "acesso_total_anon" ON veiculos;
DROP POLICY IF EXISTS "acesso_total_anon" ON carretas;
DROP POLICY IF EXISTS "acesso_total_anon" ON viagens;
DROP POLICY IF EXISTS "acesso_total_anon" ON abastecimentos;

CREATE POLICY "acesso_total_anon" ON usuarios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total_anon" ON motoristas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total_anon" ON veiculos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total_anon" ON carretas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total_anon" ON viagens FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total_anon" ON abastecimentos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
