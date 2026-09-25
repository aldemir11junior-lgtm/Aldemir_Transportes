// ─────────────────────────────────────────────────────────────────────────
// USUÁRIOS — Cadastro + Listagem (somente perfil "gerente")
// ─────────────────────────────────────────────────────────────────────────
let USUARIO_EDITANDO_ID = null;

async function renderUsuarios() {
  const box = qs('#app');

  if (STATE.usuario.perfil !== 'gerente') {
    box.innerHTML = barraNavegacaoSuperior() + `<div class="page-title">Usuários</div><div class="alerta alerta-error">Você não tem permissão para acessar esta página.</div>`;
    ligarBarraNavegacaoSuperior();
    return;
  }

  box.innerHTML = `
    ${barraNavegacaoSuperior()}
    <div class="page-title">Usuários</div>
    <div class="two-col">
      <div>
        <div class="section-title" id="usr-form-titulo">Cadastrar usuário</div>
        <div id="usr-msg"></div>
        <div id="usr-form"></div>
      </div>
      <div>
        <div class="section-title">Usuários cadastrados</div>
        <div id="usr-lista">Carregando...</div>
      </div>
    </div>
  `;
  ligarBarraNavegacaoSuperior();
  renderFormUsuario(null);
  await renderListaUsuarios();
}

async function renderFormUsuario(editando) {
  qs('#usr-form-titulo').textContent = editando ? 'Editar usuário' : 'Cadastrar usuário';
  qs('#usr-form').innerHTML = `
    <div class="field"><label>Nome *</label><input type="text" id="usr-nome" value="${escapeHtml(editando ? editando.nome : '')}"></div>
    <div class="field"><label>Nome de usuário *</label><input type="text" id="usr-login" value="${escapeHtml(editando ? editando.usuario : '')}"></div>
    <div class="field"><label>Perfil *</label>
      <select id="usr-perfil">
        <option value="operacional" ${editando && editando.perfil === 'operacional' ? 'selected' : ''}>operacional</option>
        <option value="gerente" ${editando && editando.perfil === 'gerente' ? 'selected' : ''}>gerente</option>
      </select>
    </div>
    <div class="field"><label>Senha${editando ? ' (deixe em branco para manter a atual)' : ' *'}</label><input type="password" id="usr-senha"></div>
    <div class="form-row cols-2">
      <button class="btn btn-primary" id="usr-salvar">Salvar</button>
      ${editando ? '<button class="btn" id="usr-cancelar">Cancelar edição</button>' : ''}
    </div>
  `;
  qs('#usr-salvar').addEventListener('click', () => salvarUsuario(editando));
  qs('#usr-cancelar')?.addEventListener('click', () => { USUARIO_EDITANDO_ID = null; renderFormUsuario(null); });
}

async function salvarUsuario(editando) {
  const nome = qs('#usr-nome').value.trim();
  const loginNorm = qs('#usr-login').value.trim().toLowerCase();
  const perfil = qs('#usr-perfil').value;
  const senha = qs('#usr-senha').value;

  if (!nome) { mostrarMsg('#usr-msg', 'error', 'Informe o nome do usuário.'); return; }
  if (!loginNorm) { mostrarMsg('#usr-msg', 'error', 'Informe o nome de usuário.'); return; }

  const btn = qs('#usr-salvar');
  btn.disabled = true;
  try {
    const jaExiste = await usuarioLoginExiste(loginNorm, editando ? editando.id : null);
    if (jaExiste) { mostrarMsg('#usr-msg', 'error', 'Já existe um usuário com este nome de usuário.'); btn.disabled = false; return; }
    if (!editando && !senha) { mostrarMsg('#usr-msg', 'error', 'Informe uma senha para o novo usuário.'); btn.disabled = false; return; }

    if (!editando) {
      await criarUsuarioDb(nome, loginNorm, perfil, senha);
      mostrarMsg('#usr-msg', 'success', 'Usuário cadastrado com sucesso!');
    } else {
      await atualizarUsuarioDb(editando.id, nome, loginNorm, perfil, senha || null);
      mostrarMsg('#usr-msg', 'success', 'Usuário atualizado com sucesso!');
      USUARIO_EDITANDO_ID = null;
    }
    await renderFormUsuario(null);
    await renderListaUsuarios();
  } catch (e) {
    mostrarMsg('#usr-msg', 'error', `Erro: ${escapeHtml(e.message)}`);
  } finally {
    btn.disabled = false;
  }
}

async function renderListaUsuarios() {
  const box = qs('#usr-lista');
  const lista = await listarUsuarios();
  if (!lista.length) { box.innerHTML = `<div class="alerta alerta-info">Nenhum usuário cadastrado.</div>`; return; }

  box.innerHTML = lista.map(u => `
    <div class="user-row">
      <div class="user-ava ${u.perfil === 'gerente' ? 'user-ava-admin' : ''}">${escapeHtml(u.nome[0].toUpperCase())}</div>
      <div class="user-info">
        <div class="nome">${escapeHtml(u.nome)}</div>
        <div class="status">${escapeHtml(u.usuario)} · ${escapeHtml(u.perfil)}</div>
      </div>
      <button class="btn btn-sm" data-edit="${u.id}">Editar</button>
      ${u.id !== STATE.usuario.id ? `<button class="btn btn-sm btn-danger" data-del="${u.id}">Excluir</button>` : ''}
    </div>
  `).join('');

  qsa('[data-edit]', box).forEach(btn => btn.addEventListener('click', async () => {
    const id = parseInt(btn.dataset.edit);
    const editando = await buscarUsuarioPorId(id);
    USUARIO_EDITANDO_ID = id;
    renderFormUsuario(editando);
  }));
  qsa('[data-del]', box).forEach(btn => btn.addEventListener('click', async () => {
    const id = parseInt(btn.dataset.del);
    if (!confirm('Excluir este usuário?')) return;
    try { await excluirUsuarioDb(id); await renderListaUsuarios(); }
    catch (e) { alert('Erro ao excluir: ' + e.message); }
  }));
}
