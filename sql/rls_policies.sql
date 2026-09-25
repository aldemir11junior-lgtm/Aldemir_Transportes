-- ─────────────────────────────────────────────────────────────────────────
-- POLÍTICAS DE ACESSO (RLS) PARA O FRONTEND HTML/CSS/JS
-- ─────────────────────────────────────────────────────────────────────────
-- O site novo fala DIRETO com o Supabase pelo navegador, usando a chave
-- "anon" (pública). Isso só é seguro se o RLS (Row Level Security) estiver
-- ATIVO em todas as tabelas — sem isso, qualquer pessoa que veja o código
-- do site (ex: no GitHub) consegue ler e apagar tudo do banco livremente.
--
-- Este app NÃO usa o sistema de autenticação do Supabase (Supabase Auth) —
-- ele usa login próprio (usuário/senha na tabela Orç_Usuarios, como já era
-- no Streamlit). Por isso, as políticas abaixo são "abertas" para quem tem
-- a anon key (equivalente ao nível de proteção que o app já tinha: só quem
-- conhece o site e faz login consegue usar). Isso é razoável para um app
-- pessoal/familiar com poucos usuários de confiança — mas é IMPORTANTE
-- entender que a anon key + essas políticas permitem, na prática, leitura
-- e escrita por qualquer pessoa que descubra a URL do Supabase (mesmo sem
-- login no site), então não divulgue a URL do Supabase publicamente além
-- do necessário e evite deixar o repositório do site com dados sensíveis
-- de exemplo.
--
-- Rode este script inteiro no Supabase em: SQL Editor (ícone ">_" no menu
-- lateral, abaixo de "Table Editor") → New query → cole tudo → Run.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE "Orç_Usuarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Orç_Lancamentos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Orç_Lixeira" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Orç_Categorias" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Orç_Planejamento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Orç_Planejamento_Eventos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Orç_Planejamento_Fixos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Orç_Planejamento_Limites" ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas (permite rodar o script de novo sem erro)
DROP POLICY IF EXISTS "acesso_total_anon" ON "Orç_Usuarios";
DROP POLICY IF EXISTS "acesso_total_anon" ON "Orç_Lancamentos";
DROP POLICY IF EXISTS "acesso_total_anon" ON "Orç_Lixeira";
DROP POLICY IF EXISTS "acesso_total_anon" ON "Orç_Categorias";
DROP POLICY IF EXISTS "acesso_total_anon" ON "Orç_Planejamento";
DROP POLICY IF EXISTS "acesso_total_anon" ON "Orç_Planejamento_Eventos";
DROP POLICY IF EXISTS "acesso_total_anon" ON "Orç_Planejamento_Fixos";
DROP POLICY IF EXISTS "acesso_total_anon" ON "Orç_Planejamento_Limites";

-- Libera leitura e escrita para quem usa a anon key (roles anon e authenticated)
CREATE POLICY "acesso_total_anon" ON "Orç_Usuarios" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total_anon" ON "Orç_Lancamentos" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total_anon" ON "Orç_Lixeira" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total_anon" ON "Orç_Categorias" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total_anon" ON "Orç_Planejamento" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total_anon" ON "Orç_Planejamento_Eventos" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total_anon" ON "Orç_Planejamento_Fixos" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total_anon" ON "Orç_Planejamento_Limites" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
