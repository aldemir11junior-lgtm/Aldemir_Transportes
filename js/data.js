// ─────────────────────────────────────────────────────────────────────────
// CAMADA DE DADOS — Supabase (equivalente às funções do app.py)
// Tabelas usadas (as MESMAS já existentes no banco do Streamlit):
//   usuarios, motoristas, veiculos, carretas, viagens, abastecimentos
// ─────────────────────────────────────────────────────────────────────────

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function checarErro(error, contexto) {
  if (error) {
    console.error(contexto, error);
    throw new Error(`${contexto}: ${error.message}`);
  }
}

// ─── USUÁRIOS ──────────────────────────────────────────────────────────
async function buscarUsuarioLogin(usuarioNorm) {
  const { data, error } = await sb.from('usuarios')
    .select('id, nome, usuario, senha_hash, perfil').eq('usuario', usuarioNorm).maybeSingle();
  checarErro(error, 'Erro ao buscar usuário');
  return data || null;
}
async function listarUsuarios() {
  const { data, error } = await sb.from('usuarios').select('id, nome, usuario, perfil').order('nome');
  checarErro(error, 'Erro ao carregar usuários');
  return data || [];
}
async function buscarUsuarioPorId(id) {
  const { data, error } = await sb.from('usuarios').select('id, nome, usuario, perfil').eq('id', id).maybeSingle();
  checarErro(error, 'Erro ao buscar usuário');
  return data || null;
}
async function usuarioLoginExiste(usuarioNorm, excluirId) {
  let query = sb.from('usuarios').select('id').eq('usuario', usuarioNorm);
  if (excluirId) query = query.neq('id', excluirId);
  const { data, error } = await query;
  checarErro(error, 'Erro ao verificar usuário');
  return (data || []).length > 0;
}
async function criarUsuarioDb(nome, usuarioNorm, perfil, senha) {
  const senhaHash = await hashPw(senha);
  const { error } = await sb.from('usuarios').insert({ nome, usuario: usuarioNorm, perfil, senha_hash: senhaHash });
  checarErro(error, 'Erro ao criar usuário');
}
async function atualizarUsuarioDb(id, nome, usuarioNorm, perfil, senha) {
  const campos = { nome, usuario: usuarioNorm, perfil };
  if (senha) campos.senha_hash = await hashPw(senha);
  const { error } = await sb.from('usuarios').update(campos).eq('id', id);
  checarErro(error, 'Erro ao atualizar usuário');
}
async function excluirUsuarioDb(id) {
  const { error } = await sb.from('usuarios').delete().eq('id', id);
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
async function excluirViagem(id) {
  const { error } = await sb.from('viagens').delete().eq('id', id);
  checarErro(error, 'Erro ao excluir viagem');
}

// ─── ABASTECIMENTOS ────────────────────────────────────────────────────
async function listarAbastecimentos() {
  const { data, error } = await sb.from('abastecimentos')
    .select('id, data, veiculo_id, motorista_id, litros, valor_pago, hodometro, cidade, criado_por_id')
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
  const { error } = await sb.from('abastecimentos').delete().eq('id', id);
  checarErro(error, 'Erro ao excluir abastecimento');
}

// ─── CARREGAR TUDO DE UMA VEZ (equivalente ao carregar_dados do app.py) ──
async function carregarDados() {
  const [motoristas, veiculos, carretas, viagens, abastecimentos] = await Promise.all([
    listarMotoristas(), listarVeiculos(), listarCarretas(), listarViagens(), listarAbastecimentos(),
  ]);
  return { motoristas, veiculos, carretas, viagens, abastecimentos };
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
    };
  });
}
