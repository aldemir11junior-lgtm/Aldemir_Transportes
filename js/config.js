// ─────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÃO DO SUPABASE
// ─────────────────────────────────────────────────────────────────────────
// Preencha com os dados do SEU projeto Supabase (Project Settings > API):
//   SUPABASE_URL      -> "Project URL"      (ex: https://xxxxx.supabase.co)
//   SUPABASE_ANON_KEY -> "anon" / "public" key
//
// Esses dois valores são SEGUROS para ficar no código do site (inclusive
// no GitHub público), DESDE QUE você tenha ativado o RLS (Row Level
// Security) nas tabelas, com as políticas do arquivo sql/rls_policies.sql.
// Sem RLS ativo, qualquer pessoa com esses dados consegue ler/escrever
// livremente no banco — por isso o script SQL é obrigatório, não opcional.
// ─────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = "https://ldeylbjwwvjyvmxpnfpl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mkiSTRgfMw2snJAE3PEopQ_XNlnLAIE";
