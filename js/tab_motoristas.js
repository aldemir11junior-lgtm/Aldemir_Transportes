// ─────────────────────────────────────────────────────────────────────────
// MOTORISTAS — Cadastro + Listagem
// ─────────────────────────────────────────────────────────────────────────
let MOTORISTA_EDITANDO_ID = null;

function renderMotoristas() {
  const box = qs('#app');
  box.innerHTML = `
    ${barraNavegacaoSuperior()}
    <div class="page-title">Motoristas</div>
    <div class="two-col">
      <div>
        <div class="section-title" id="mot-form-titulo">Cadastrar motorista</div>
        <div id="mot-msg"></div>
        <div id="mot-form"></div>
      </div>
      <div>
        <div class="section-title">Motoristas cadastrados</div>
        <div id="mot-lista"></div>
      </div>
    </div>
  `;
  ligarBarraNavegacaoSuperior();
  renderFormMotorista();
  renderListaMotoristas();
}

function renderFormMotorista() {
  const editando = MOTORISTA_EDITANDO_ID ? buscarPorId(STATE.dados.motoristas, MOTORISTA_EDITANDO_ID) : null;
  qs('#mot-form-titulo').textContent = editando ? 'Editar motorista' : 'Cadastrar motorista';
  qs('#mot-form').innerHTML = `
    <div class="field"><label>Nome *</label><input type="text" id="mot-nome" value="${escapeHtml(editando ? editando.nome : '')}"></div>
    <div class="field"><label>CNH</label><input type="text" id="mot-cnh" value="${escapeHtml(editando ? (editando.cnh || '') : '')}"></div>
    <div class="field"><label>Telefone</label><input type="text" id="mot-telefone" value="${escapeHtml(editando ? (editando.telefone || '') : '')}"></div>
    <div class="form-row cols-2">
      <button class="btn btn-primary" id="mot-salvar">Salvar</button>
      ${editando ? '<button class="btn" id="mot-cancelar">Cancelar edição</button>' : ''}
    </div>
  `;
  qs('#mot-salvar').addEventListener('click', () => salvarMotorista(editando));
  qs('#mot-cancelar')?.addEventListener('click', () => { MOTORISTA_EDITANDO_ID = null; renderFormMotorista(); });
}

async function salvarMotorista(editando) {
  const nome = qs('#mot-nome').value.trim();
  const cnh = qs('#mot-cnh').value.trim();
  const telefone = qs('#mot-telefone').value.trim();
  if (!nome) { mostrarMsg('#mot-msg', 'error', 'Informe o nome do motorista.'); return; }

  const btn = qs('#mot-salvar');
  btn.disabled = true;
  try {
    if (!editando) { await criarMotorista(nome, cnh, telefone); mostrarMsg('#mot-msg', 'success', 'Motorista cadastrado.'); }
    else { await atualizarMotorista(editando.id, nome, cnh, telefone); mostrarMsg('#mot-msg', 'success', 'Motorista atualizado.'); MOTORISTA_EDITANDO_ID = null; }
    await atualizarDados();
    renderFormMotorista();
    renderListaMotoristas();
  } catch (e) {
    mostrarMsg('#mot-msg', 'error', `Erro: ${escapeHtml(e.message)}`);
  } finally {
    btn.disabled = false;
  }
}

function renderListaMotoristas() {
  const box = qs('#mot-lista');
  const lista = STATE.dados.motoristas;
  if (!lista.length) { box.innerHTML = `<div class="alerta alerta-info">Nenhum motorista cadastrado.</div>`; return; }

  box.innerHTML = lista.map(m => `
    <div class="user-row">
      <div class="user-info">
        <div class="nome">${escapeHtml(m.nome)}</div>
        <div class="status">${escapeHtml(m.cnh || '-')} · ${escapeHtml(m.telefone || '-')}</div>
      </div>
      <button class="btn btn-sm" data-edit="${m.id}">Editar</button>
      ${STATE.usuario.perfil === 'gerente' ? `<button class="btn btn-sm btn-danger" data-del="${m.id}">Excluir</button>` : ''}
    </div>
  `).join('');

  qsa('[data-edit]', box).forEach(btn => btn.addEventListener('click', () => {
    MOTORISTA_EDITANDO_ID = parseInt(btn.dataset.edit);
    renderFormMotorista();
  }));
  qsa('[data-del]', box).forEach(btn => btn.addEventListener('click', async () => {
    const id = parseInt(btn.dataset.del);
    if (!confirm('Excluir este motorista?')) return;
    try { await excluirMotorista(id); await atualizarDados(); renderListaMotoristas(); }
    catch (e) { alert('Erro ao excluir: ' + e.message); }
  }));
}
