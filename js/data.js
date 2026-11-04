// ─────────────────────────────────────────────────────────────────────────
// CAMADA DE DADOS — Supabase (equivalente às funções do app.py)
// Tabelas usadas (as MESMAS já existentes no banco do Streamlit):
//   usuarios, motoristas, veiculos, carretas, viagens, abastecimentos
// ─────────────────────────────────────────────────────────────────────────

// Token da sessão: o banco só libera as tabelas para quem manda este cabeçalho
// (ver sql/rls_policies.sql). Ele é obtido no login e descartado no logout.
let SESSAO_TOKEN = null;
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    fetch: (url, opcoes = {}) => {
      const headers = new Headers(opcoes.headers);
      if (SESSAO_TOKEN) headers.set('x-sessao-token', SESSAO_TOKEN);
      return fetch(url, { ...opcoes, headers });
    },
  },
});

function checarErro(error, contexto) {
  if (error) {
    console.error(contexto, error);
    throw new Error(`${contexto}: ${error.message}`);
  }
}

// ─── USUÁRIOS (todas as operações passam por funções do banco) ─────────
async function loginDb(usuarioNorm, senhaHash) {
  const { data, error } = await sb.rpc('login_app', { p_usuario: usuarioNorm, p_senha_hash: senhaHash });
  checarErro(error, 'Erro ao entrar');
  return data || null;
}
async function logoutDb() {
  try { await sb.rpc('logout_app'); } catch (e) { console.warn('Falha ao encerrar sessão:', e); }
  SESSAO_TOKEN = null;
}
async function listarUsuarios() {
  const { data, error } = await sb.rpc('listar_usuarios_app');
  checarErro(error, 'Erro ao carregar usuários');
  return data || [];
}
async function buscarUsuarioPorId(id) {
  const { data, error } = await sb.rpc('buscar_usuario_app', { p_id: id });
  checarErro(error, 'Erro ao buscar usuário');
  return data || null;
}
async function usuarioLoginExiste(usuarioNorm, excluirId) {
  const { data, error } = await sb.rpc('usuario_login_existe_app', { p_usuario: usuarioNorm, p_excluir_id: excluirId || null });
  checarErro(error, 'Erro ao verificar usuário');
  return !!data;
}
async function criarUsuarioDb(nome, usuarioNorm, perfil, senha) {
  const senhaHash = await hashPw(senha);
  const { error } = await sb.rpc('criar_usuario_app', { p_nome: nome, p_usuario: usuarioNorm, p_perfil: perfil, p_senha_hash: senhaHash });
  checarErro(error, 'Erro ao criar usuário');
}
async function atualizarUsuarioDb(id, nome, usuarioNorm, perfil, senha) {
  const senhaHash = senha ? await hashPw(senha) : null;
  const { error } = await sb.rpc('atualizar_usuario_app', { p_id: id, p_nome: nome, p_usuario: usuarioNorm, p_perfil: perfil, p_senha_hash: senhaHash });
  checarErro(error, 'Erro ao atualizar usuário');
}
async function excluirUsuarioDb(id) {
  const { error } = await sb.rpc('excluir_usuario_app', { p_id: id });
  checarErro(error, 'Erro ao excluir usuário');
}

// ─── MOTORISTAS ────────────────────────────────────────────────────────
async function listarMotoristas() {
  const { data, error } = await sb.from('motoristas').select('id, nome, cnh, telefone').order('nome');
  checarErro(error, 'Erro ao carregar motoristas');
  return data || [];
}
async function criarMotorista(nome, cnh, telefone) {
  const { error } = await sb.from('motoristas').insert({ nome, cnh, telefone });
  checarErro(error, 'Erro ao cadastrar motorista');
}
async function atualizarMotorista(id, nome, cnh, telefone) {
  const { error } = await sb.from('motoristas').update({ nome, cnh, telefone }).eq('id', id);
  checarErro(error, 'Erro ao atualizar motorista');
}
async function excluirMotorista(id) {
  const { error } = await sb.from('motoristas').delete().eq('id', id);
  checarErro(error, 'Erro ao excluir motorista');
}

// ─── VEÍCULOS (CAVALOS) ──────────────────────────────────────────────────
async function listarVeiculos() {
  const { data, error } = await sb.from('veiculos').select('id, placa, modelo, capacidade_kg').order('placa');
  checarErro(error, 'Erro ao carregar veículos');
  return data || [];
}
async function criarVeiculo(placa, modelo, capacidadeKg) {
  const { error } = await sb.from('veiculos').insert({ placa, modelo, capacidade_kg: capacidadeKg });
  checarErro(error, 'Erro ao cadastrar veículo');
}
async function atualizarVeiculo(id, placa, modelo, capacidadeKg) {
  const { error } = await sb.from('veiculos').update({ placa, modelo, capacidade_kg: capacidadeKg }).eq('id', id);
  checarErro(error, 'Erro ao atualizar veículo');
}
async function excluirVeiculo(id) {
  const { error } = await sb.from('veiculos').delete().eq('id', id);
  checarErro(error, 'Erro ao excluir veículo');
}

// ─── CARRETAS ──────────────────────────────────────────────────────────
async function listarCarretas() {
  const { data, error } = await sb.from('carretas').select('id, placa, modelo, capacidade_kg').order('placa');
  checarErro(error, 'Erro ao carregar carretas');
  return data || [];
}
async function criarCarreta(placa, modelo, capacidadeKg) {
  const { error } = await sb.from('carretas').insert({ placa, modelo, capacidade_kg: capacidadeKg });
  checarErro(error, 'Erro ao cadastrar carreta');
}
async function atualizarCarreta(id, placa, modelo, capacidadeKg) {
  const { error } = await sb.from('carretas').update({ placa, modelo, capacidade_kg: capacidadeKg }).eq('id', id);
  checarErro(error, 'Erro ao atualizar carreta');
}
async function excluirCarreta(id) {
  const { error } = await sb.from('carretas').delete().eq('id', id);
  checarErro(error, 'Erro ao excluir carreta');
}

// ─── VIAGENS ───────────────────────────────────────────────────────────
async function listarViagens() {
  const { data, error } = await sb.from('viagens').select('*').order('data', { ascending: false }).order('id', { ascending: false });
  checarErro(error, 'Erro ao carregar viagens');
  return data || [];
}
async function criarViagem(registro) {
  const { error } = await sb.from('viagens').insert(registro);
  checarErro(error, 'Erro ao lançar viagem');
}
async function atualizarViagem(id, registro) {
  const { error } = await sb.from('viagens').update(registro).eq('id', id);
  checarErro(error, 'Erro ao atualizar viagem');
}
// Exclusão em duas etapas: vai para "Excluídas" (excluido_em) e só é apagada do banco após DIAS_LIXEIRA dias.
async function excluirViagem(id) {
  const { error } = await sb.from('viagens').update({ excluido_em: new Date().toISOString() }).eq('id', id);
  checarErro(error, 'Erro ao excluir viagem');
}
async function restaurarViagem(id) {
  const { error } = await sb.from('viagens').update({ excluido_em: null }).eq('id', id);
  checarErro(error, 'Erro ao restaurar viagem');
}
async function apagarViagemDefinitivo(id) {
  const { error } = await sb.from('viagens').delete().eq('id', id);
  checarErro(error, 'Erro ao apagar viagem');
}

// ─── ABASTECIMENTOS ────────────────────────────────────────────────────
async function listarAbastecimentos() {
  const { data, error } = await sb.from('abastecimentos')
    .select('id, data, veiculo_id, motorista_id, litros, valor_pago, hodometro, cidade, criado_por_id, excluido_em')
    .order('data', { ascending: false }).order('id', { ascending: false });
  checarErro(error, 'Erro ao carregar abastecimentos');
  return data || [];
}
async function criarAbastecimento(registro) {
  const { error } = await sb.from('abastecimentos').insert(registro);
  checarErro(error, 'Erro ao lançar abastecimento');
}
async function atualizarAbastecimento(id, registro) {
  const { error } = await sb.from('abastecimentos').update(registro).eq('id', id);
  checarErro(error, 'Erro ao atualizar abastecimento');
}
async function excluirAbastecimento(id) {
  const { error } = await sb.from('abastecimentos').update({ excluido_em: new Date().toISOString() }).eq('id', id);
  checarErro(error, 'Erro ao excluir abastecimento');
}
async function restaurarAbastecimento(id) {
  const { error } = await sb.from('abastecimentos').update({ excluido_em: null }).eq('id', id);
  checarErro(error, 'Erro ao restaurar abastecimento');
}
async function apagarAbastecimentoDefinitivo(id) {
  const { error } = await sb.from('abastecimentos').delete().eq('id', id);
  checarErro(error, 'Erro ao apagar abastecimento');
}

// ─── LIXEIRA: apaga do banco o que está excluído há mais de DIAS_LIXEIRA dias ──
const DIAS_LIXEIRA = 15;
async function purgarExcluidosVencidos() {
  const limite = new Date(Date.now() - DIAS_LIXEIRA * 24 * 60 * 60 * 1000).toISOString();
  for (const tabela of ['viagens', 'abastecimentos']) {
    const { error } = await sb.from(tabela).delete().lt('excluido_em', limite);
    if (error) console.warn(`Não foi possível limpar ${tabela} excluídos:`, error);
  }
}
function diasRestantesExclusao(excluidoEm) {
  const decorrido = Date.now() - new Date(excluidoEm).getTime();
  return Math.max(0, Math.ceil(DIAS_LIXEIRA - decorrido / (24 * 60 * 60 * 1000)));
}

// ─── CARREGAR TUDO DE UMA VEZ (equivalente ao carregar_dados do app.py) ──
// `viagens` e `abastecimentos` trazem só os ativos; os excluídos ficam em *_excluidas.
async function carregarDados() {
  await purgarExcluidosVencidos();
  const [motoristas, veiculos, carretas, todasViagens, todosAbastecimentos] = await Promise.all([
    listarMotoristas(), listarVeiculos(), listarCarretas(), listarViagens(), listarAbastecimentos(),
  ]);
  return {
    motoristas, veiculos, carretas,
    viagens: todasViagens.filter(v => !v.excluido_em),
    viagens_excluidas: todasViagens.filter(v => v.excluido_em),
    abastecimentos: todosAbastecimentos.filter(a => !a.excluido_em),
    abastecimentos_excluidos: todosAbastecimentos.filter(a => a.excluido_em),
  };
}

// ─── FUNÇÕES AUXILIARES DE CONSULTA (mesmas do app.py) ──────────────────
function buscarPorId(lista, id) {
  return (lista || []).find(item => item.id === id) || null;
}
function nomeVeiculo(dados, veiculoId) {
  const v = buscarPorId(dados.veiculos, veiculoId);
  return v ? v.placa : '-';
}
function nomeMotorista(dados, motoristaId) {
  const m = buscarPorId(dados.motoristas, motoristaId);
  return m ? m.nome : '-';
}
function nomeCarreta(dados, carretaId) {
  const c = buscarPorId(dados.carretas, carretaId);
  return c ? c.placa : '-';
}

function viagensParaLista(dados) {
  return (dados.viagens || []).map(v => {
    const adiantamento = parseFloat(v.faturamento_adiantamento || 0);
    const restante = parseFloat(v.faturamento_restante || 0);
    const pedagio = parseFloat(v.pedagio || 0);
    const outrosCustos = parseFloat(v.outros_custos || 0);
    return {
      id: v.id, data: v.data,
      veiculo: nomeVeiculo(dados, v.veiculo_id),
      veiculo_id: v.veiculo_id,
      carreta: v.carreta_modelo || '-',
      carreta_modelo: v.carreta_modelo,
      motorista: nomeMotorista(dados, v.motorista_id),
      motorista_id: v.motorista_id,
      origem: v.origem, destino: v.destino,
      volume_tons: parseFloat(v.volume_tons || 0),
      faturamento_adiantamento: adiantamento,
      faturamento_restante: restante,
      faturamento: adiantamento + restante,
      pedagio, outros_custos: outrosCustos,
      custo_total: pedagio + outrosCustos,
      status: v.status, observacoes: v.observacoes || '',
      excluido_em: v.excluido_em || null,
    };
  });
}

function abastecimentosParaLista(dados) {
  const ordenados = [...(dados.abastecimentos || [])].sort((a, b) => {
    if (a.veiculo_id !== b.veiculo_id) return a.veiculo_id - b.veiculo_id;
    if (a.data !== b.data) return a.data < b.data ? -1 : 1;
    return a.id - b.id;
  });
  const kmRodadoPorId = {};
  const hodometroAnteriorPorVeiculo = {};
  for (const a of ordenados) {
    const hodometroAtual = parseFloat(a.hodometro);
    if (a.veiculo_id in hodometroAnteriorPorVeiculo) {
      kmRodadoPorId[a.id] = hodometroAtual - hodometroAnteriorPorVeiculo[a.veiculo_id];
    } else {
      kmRodadoPorId[a.id] = null;
    }
    hodometroAnteriorPorVeiculo[a.veiculo_id] = hodometroAtual;
  }

  return (dados.abastecimentos || []).map(a => {
    const litros = parseFloat(a.litros || 0);
    const valorPago = parseFloat(a.valor_pago || 0);
    return {
      id: a.id, data: a.data,
      veiculo: nomeVeiculo(dados, a.veiculo_id), veiculo_id: a.veiculo_id,
      motorista: nomeMotorista(dados, a.motorista_id), motorista_id: a.motorista_id,
      litros, valor_pago: valorPago,
      valor_por_litro: litros ? (valorPago / litros) : 0,
      hodometro: parseFloat(a.hodometro || 0),
      km_rodado: kmRodadoPorId[a.id],
      cidade: a.cidade,
      excluido_em: a.excluido_em || null,
    };
  });
}
