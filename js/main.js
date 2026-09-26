// ─────────────────────────────────────────────────────────────────────────
// ESTADO GLOBAL + NAVEGAÇÃO
// Fluxo: Login → Menu (Gerencial/Operacional/Sair) → Submenu (páginas da
// categoria) → Página (com Voltar/Sair no topo) — igual ao app.py.
// ─────────────────────────────────────────────────────────────────────────

const MENU_PRINCIPAL = [
  { chave: 'dashboard', label: 'Dashboard', apenasGerente: true },
  { chave: 'viagens', label: 'Viagens' },
  { chave: 'combustivel', label: 'Combustível' },
  { chave: 'manutencao', label: 'Manutenção' },
  { chave: 'cadastro', label: 'Cadastro', apenasGerente: true },
  { chave: 'usuarios', label: 'Usuários', apenasGerente: true },
];
const CADASTRO_OPCOES = [
  { chave: 'motoristas', label: 'Motorista' },
  { chave: 'frota', label: 'Frota' },
];

const STATE = {
  usuario: null,
  categoriaAtual: null,
  paginaAtual: null,
  dados: { motoristas: [], veiculos: [], carretas: [], viagens: [], abastecimentos: [] },
  editando: {}, // ex: { motoristaId, veiculoId, carretaId, usuarioId, viagemId, abastecimentoId }
};

async function iniciarApp() {
  renderizarTela();
}

function renderizarTela() {
  qs('#tela-login').style.display = 'none';
  qs('#tela-menu').style.display = 'none';
  qs('#tela-submenu').style.display = 'none';
  qs('#app').style.display = 'none';

  if (!STATE.usuario) {
    qs('#tela-login').style.display = 'block';
  } else if (!STATE.categoriaAtual) {
    qs('#tela-menu').style.display = 'block';
    renderMenuInicial();
  } else if (!STATE.paginaAtual) {
    qs('#tela-submenu').style.display = 'block';
    renderSubmenu();
  } else {
    qs('#app').style.display = 'block';
    renderPagina();
  }
}

function renderMenuInicial() {
  const box = qs('#tela-menu');
  const u = STATE.usuario;
  let html = `
    <div class="login-header">
      <div class="login-brand">Aldemir<span>Transportes</span></div>
      <div class="login-brand-sub">Bem-vindo(a), ${escapeHtml(u.nome)}</div>
      <div class="login-brand-bar"></div>
    </div>
    <div class="menu-box">
  `;
  for (const o of MENU_PRINCIPAL) {
    if (o.apenasGerente && u.perfil !== 'gerente') continue;
    html += `<button class="btn btn-menu" data-menu="${o.chave}">${escapeHtml(o.label)}</button>`;
  }
  html += `
    </div>
    <div class="menu-sair-row"><button class="btn btn-sm" id="menu-sair">Sair</button></div>
  `;
  box.innerHTML = html;

  qsa('[data-menu]', box).forEach(btn => btn.addEventListener('click', () => {
    const chave = btn.dataset.menu;
    if (chave === 'cadastro') {
      STATE.categoriaAtual = 'cadastro';
    } else {
      STATE.categoriaAtual = 'root';
      STATE.paginaAtual = chave;
    }
    renderizarTela();
  }));
  qs('#menu-sair').addEventListener('click', fazerLogout);
}

function renderSubmenu() {
  const box = qs('#tela-submenu');
  let html = `
    <div class="top-nav"><button class="btn btn-sm" id="submenu-voltar">Voltar</button></div>
    <div class="login-header">
      <div class="login-brand">Cadastro</div>
      <div class="login-brand-bar"></div>
    </div>
    <div class="menu-box">
  `;
  for (const o of CADASTRO_OPCOES) {
    html += `<button class="btn btn-menu" data-pagina="${o.chave}">${escapeHtml(o.label)}</button>`;
  }
  html += `</div>`;
  box.innerHTML = html;

  qsa('[data-pagina]', box).forEach(btn => btn.addEventListener('click', () => {
    STATE.paginaAtual = btn.dataset.pagina;
    renderizarTela();
  }));
  qs('#submenu-voltar').addEventListener('click', () => { STATE.categoriaAtual = null; renderizarTela(); });
}

// Botões Voltar/Sair no topo de cada página (equivalente a barra_navegacao_superior)
function barraNavegacaoSuperior() {
  return `
    <div class="top-nav">
      <button class="btn btn-sm" id="pg-voltar">Voltar</button>
      <button class="btn btn-sm" id="pg-sair">Sair</button>
    </div>
  `;
}
function ligarBarraNavegacaoSuperior() {
  qs('#pg-voltar').addEventListener('click', () => {
    STATE.paginaAtual = null;
    if (STATE.categoriaAtual !== 'cadastro') STATE.categoriaAtual = null;
    renderizarTela();
  });
  qs('#pg-sair').addEventListener('click', fazerLogout);
}

async function atualizarDados() {
  STATE.dados = await carregarDados();
}

function renderPagina() {
  const pagina = STATE.paginaAtual;
  try {
    if (pagina === 'dashboard') renderDashboard();
    else if (pagina === 'viagens') renderViagens();
    else if (pagina === 'combustivel') renderCombustivel();
    else if (pagina === 'motoristas') renderMotoristas();
    else if (pagina === 'frota') renderFrota();
    else if (pagina === 'usuarios') renderUsuarios();
    else if (pagina === 'manutencao') renderManutencao();
  } catch (e) {
    console.error(`Erro ao renderizar página ${pagina}:`, e);
    qs('#app').innerHTML = barraNavegacaoSuperior() + `<div class="alerta alerta-error">Ocorreu um erro ao carregar esta página: ${escapeHtml(e.message)}</div>`;
    ligarBarraNavegacaoSuperior();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  configurarAuth();
  renderizarTela();
});
