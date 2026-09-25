// ─────────────────────────────────────────────────────────────────────────
// FROTA — Cavalos (veículos) + Carretas
// ─────────────────────────────────────────────────────────────────────────
let FROTA_SUBABA = 'cavalos';
let VEICULO_EDITANDO_ID = null;
let CARRETA_EDITANDO_ID = null;

function renderFrota() {
  const box = qs('#app');
  box.innerHTML = `
    ${barraNavegacaoSuperior()}
    <div class="page-title">Frota</div>
    <div class="login-abas" style="max-width:420px;">
      <button class="login-aba-btn ${FROTA_SUBABA === 'cavalos' ? 'active' : ''}" data-sub="cavalos">Cavalos</button>
      <button class="login-aba-btn ${FROTA_SUBABA === 'carretas' ? 'active' : ''}" data-sub="carretas">Carretas</button>
    </div>
    <div id="frota-corpo"></div>
  `;
  ligarBarraNavegacaoSuperior();
  qsa('[data-sub]', box).forEach(btn => btn.addEventListener('click', () => { FROTA_SUBABA = btn.dataset.sub; renderFrota(); }));

  if (FROTA_SUBABA === 'cavalos') renderAbaCavalos();
  else renderAbaCarretas();
}

function renderAbaCavalos() {
  const box = qs('#frota-corpo');
  box.innerHTML = `
    <div class="two-col">
      <div>
        <div class="section-title" id="veic-form-titulo">Cadastrar cavalo (frota)</div>
        <div id="veic-msg"></div>
        <div id="veic-form"></div>
      </div>
      <div>
        <div class="section-title">Cavalos cadastrados</div>
        <div id="veic-lista"></div>
      </div>
    </div>
  `;
  renderFormVeiculo();
  renderListaVeiculos();
}

function renderFormVeiculo() {
  const editando = VEICULO_EDITANDO_ID ? buscarPorId(STATE.dados.veiculos, VEICULO_EDITANDO_ID) : null;
  qs('#veic-form-titulo').textContent = editando ? 'Editar cavalo' : 'Cadastrar cavalo (frota)';
  qs('#veic-form').innerHTML = `
    <div class="field"><label>Placa *</label><input type="text" id="veic-placa" placeholder="ABC1D23" value="${escapeHtml(editando ? editando.placa : '')}"></div>
    <div class="field"><label>Modelo</label><input type="text" id="veic-modelo" value="${escapeHtml(editando ? (editando.modelo || '') : '')}"></div>
    <div class="field"><label>Capacidade (KG)</label><input type="number" min="0" step="100" id="veic-capacidade" value="${editando ? editando.capacidade_kg : 0}"></div>
    <div class="form-row cols-2">
      <button class="btn btn-primary" id="veic-salvar">Salvar</button>
      ${editando ? '<button class="btn" id="veic-cancelar">Cancelar edição</button>' : ''}
    </div>
  `;
  qs('#veic-salvar').addEventListener('click', () => salvarVeiculo(editando));
  qs('#veic-cancelar')?.addEventListener('click', () => { VEICULO_EDITANDO_ID = null; renderFormVeiculo(); });
}

async function salvarVeiculo(editando) {
  const placa = qs('#veic-placa').value.trim().toUpperCase();
  const modelo = qs('#veic-modelo').value.trim();
  const capacidade = parseFloat(qs('#veic-capacidade').value) || 0;
  if (!placa) { mostrarMsg('#veic-msg', 'error', 'Informe a placa do cavalo.'); return; }

  const btn = qs('#veic-salvar');
  btn.disabled = true;
  try {
    if (!editando) { await criarVeiculo(placa, modelo, capacidade); mostrarMsg('#veic-msg', 'success', 'Cavalo cadastrado.'); }
    else { await atualizarVeiculo(editando.id, placa, modelo, capacidade); mostrarMsg('#veic-msg', 'success', 'Cavalo atualizado.'); VEICULO_EDITANDO_ID = null; }
    await atualizarDados();
    renderFormVeiculo();
    renderListaVeiculos();
  } catch (e) {
    mostrarMsg('#veic-msg', 'error', `Erro: ${escapeHtml(e.message)}`);
  } finally {
    btn.disabled = false;
  }
}

function renderListaVeiculos() {
  const box = qs('#veic-lista');
  const lista = STATE.dados.veiculos;
  if (!lista.length) { box.innerHTML = `<div class="alerta alerta-info">Nenhum cavalo cadastrado.</div>`; return; }

  box.innerHTML = lista.map(v => `
    <div class="user-row">
      <div class="user-info">
        <div class="nome">${escapeHtml(v.placa)}</div>
        <div class="status">${escapeHtml(v.modelo || '-')} · ${formatarNumero(v.capacidade_kg, 0)} kg</div>
      </div>
      <button class="btn btn-sm" data-edit="${v.id}">Editar</button>
      ${STATE.usuario.perfil === 'gerente' ? `<button class="btn btn-sm btn-danger" data-del="${v.id}">Excluir</button>` : ''}
    </div>
  `).join('');

  qsa('[data-edit]', box).forEach(btn => btn.addEventListener('click', () => {
    VEICULO_EDITANDO_ID = parseInt(btn.dataset.edit);
    renderFormVeiculo();
  }));
  qsa('[data-del]', box).forEach(btn => btn.addEventListener('click', async () => {
    const id = parseInt(btn.dataset.del);
    if (!confirm('Excluir este cavalo?')) return;
    try { await excluirVeiculo(id); await atualizarDados(); renderListaVeiculos(); }
    catch (e) { alert('Erro ao excluir: ' + e.message); }
  }));
}

function renderAbaCarretas() {
  const box = qs('#frota-corpo');
  box.innerHTML = `
    <div class="two-col">
      <div>
        <div class="section-title" id="carr-form-titulo">Cadastrar carreta</div>
        <div id="carr-msg"></div>
        <div id="carr-form"></div>
      </div>
      <div>
        <div class="section-title">Carretas cadastradas</div>
        <div id="carr-lista"></div>
      </div>
    </div>
  `;
  renderFormCarreta();
  renderListaCarretas();
}

function renderFormCarreta() {
  const editando = CARRETA_EDITANDO_ID ? buscarPorId(STATE.dados.carretas, CARRETA_EDITANDO_ID) : null;
  qs('#carr-form-titulo').textContent = editando ? 'Editar carreta' : 'Cadastrar carreta';
  qs('#carr-form').innerHTML = `
    <div class="field"><label>Placa da carreta *</label><input type="text" id="carr-placa" placeholder="ABC1D23" value="${escapeHtml(editando ? editando.placa : '')}"></div>
    <div class="field"><label>Modelo *</label><input type="text" id="carr-modelo" placeholder="Ex: Basculante, Graneleira" value="${escapeHtml(editando ? (editando.modelo || '') : '')}"></div>
    <div class="field"><label>Capacidade (KG)</label><input type="number" min="0" step="100" id="carr-capacidade" value="${editando ? editando.capacidade_kg : 0}"></div>
    <div class="form-row cols-2">
      <button class="btn btn-primary" id="carr-salvar">Salvar</button>
      ${editando ? '<button class="btn" id="carr-cancelar">Cancelar edição</button>' : ''}
    </div>
  `;
  qs('#carr-salvar').addEventListener('click', () => salvarCarreta(editando));
  qs('#carr-cancelar')?.addEventListener('click', () => { CARRETA_EDITANDO_ID = null; renderFormCarreta(); });
}

async function salvarCarreta(editando) {
  const placa = qs('#carr-placa').value.trim().toUpperCase();
  const modelo = qs('#carr-modelo').value.trim();
  const capacidade = parseFloat(qs('#carr-capacidade').value) || 0;
  if (!placa) { mostrarMsg('#carr-msg', 'error', 'Informe a placa da carreta.'); return; }
  if (!modelo) { mostrarMsg('#carr-msg', 'error', 'Informe o modelo da carreta.'); return; }

  const btn = qs('#carr-salvar');
  btn.disabled = true;
  try {
    if (!editando) { await criarCarreta(placa, modelo, capacidade); mostrarMsg('#carr-msg', 'success', 'Carreta cadastrada.'); }
    else { await atualizarCarreta(editando.id, placa, modelo, capacidade); mostrarMsg('#carr-msg', 'success', 'Carreta atualizada.'); CARRETA_EDITANDO_ID = null; }
    await atualizarDados();
    renderFormCarreta();
    renderListaCarretas();
  } catch (e) {
    mostrarMsg('#carr-msg', 'error', `Erro: ${escapeHtml(e.message)}`);
  } finally {
    btn.disabled = false;
  }
}

function renderListaCarretas() {
  const box = qs('#carr-lista');
  const lista = STATE.dados.carretas;
  if (!lista.length) { box.innerHTML = `<div class="alerta alerta-info">Nenhuma carreta cadastrada.</div>`; return; }

  box.innerHTML = lista.map(c => `
    <div class="user-row">
      <div class="user-info">
        <div class="nome">${escapeHtml(c.placa)}</div>
        <div class="status">${escapeHtml(c.modelo || '-')} · ${formatarNumero(c.capacidade_kg, 0)} kg</div>
      </div>
      <button class="btn btn-sm" data-edit="${c.id}">Editar</button>
      ${STATE.usuario.perfil === 'gerente' ? `<button class="btn btn-sm btn-danger" data-del="${c.id}">Excluir</button>` : ''}
    </div>
  `).join('');

  qsa('[data-edit]', box).forEach(btn => btn.addEventListener('click', () => {
    CARRETA_EDITANDO_ID = parseInt(btn.dataset.edit);
    renderFormCarreta();
  }));
  qsa('[data-del]', box).forEach(btn => btn.addEventListener('click', async () => {
    const id = parseInt(btn.dataset.del);
    if (!confirm('Excluir esta carreta?')) return;
    try { await excluirCarreta(id); await atualizarDados(); renderListaCarretas(); }
    catch (e) { alert('Erro ao excluir: ' + e.message); }
  }));
}
