// ─────────────────────────────────────────────────────────────────────────
// ESTADO GLOBAL + NAVEGAÇÃO
// Fluxo: Login → Menu (Gerencial/Operacional/Sair) → Submenu (páginas da
// categoria) → Página (com Voltar/Sair no topo) — igual ao app.py.
// ─────────────────────────────────────────────────────────────────────────

const MENU_GERENCIAL = [
  { chave: 'dashboard', label: 'Dashboard' },
  { chave: 'motoristas', label: 'Motoristas' },
  { chave: 'frota', label: 'Frota' },
  { chave: 'usuarios', label: 'Usuários' },
];
const MENU_OPERACIONAL = [
  { chave: 'viagens', label: 'Viagens' },
  { chave: 'combustivel', label: 'Combustível' },
  { chave: 'manutencao', label: 'Manutenção' },
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
  if (u.perfil === 'gerente') {
    html += `<button class="btn btn-menu" id="menu-gerencial">Gerencial</button>`;
  }
  html += `
      <button class="btn btn-menu" id="menu-operacional">Operacional</button>
      <button class="btn btn-block" id="menu-sair" style="margin-top:18px;">Sair</button>
    </div>
  `;
  box.innerHTML = html;

  qs('#menu-gerencial')?.addEventListener('click', () => { STATE.categoriaAtual = 'gerencial'; renderizarTela(); });
  qs('#menu-operacional').addEventListener('click', () => { STATE.categoriaAtual = 'operacional'; renderizarTela(); });
  qs('#menu-sair').addEventListener('click', fazerLogout);
}

function renderSubmenu() {
  const box = qs('#tela-submenu');
  const opcoes = STATE.categoriaAtual === 'gerencial' ? MENU_GERENCIAL : MENU_OPERACIONAL;
  const titulo = STATE.categoriaAtual === 'gerencial' ? 'Gerencial' : 'Operacional';

  let html = `
    <div class="login-header">
      <div class="login-brand">${titulo}</div>
      <div class="login-brand-bar"></div>
    </div>
    <div class="menu-box">
  `;
  for (const o of opcoes) {
    html += `<button class="btn btn-menu" data-pagina="${o.chave}">${escapeHtml(o.label)}</button>`;
  }
  html += `
      <button class="btn btn-block" id="submenu-voltar" style="margin-top:18px;">Voltar</button>
      <button class="btn btn-block" id="submenu-sair">Sair</button>
    </div>
  `;
  box.innerHTML = html;

  qsa('[data-pagina]', box).forEach(btn => btn.addEventListener('click', () => {
    STATE.paginaAtual = btn.dataset.pagina;
    renderizarTela();
  }));
  qs('#submenu-voltar').addEventListener('click', () => { STATE.categoriaAtual = null; renderizarTela(); });
  qs('#submenu-sair').addEventListener('click', fazerLogout);
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
  qs('#pg-voltar').addEventListener('click', () => { STATE.paginaAtual = null; renderizarTela(); });
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
