// ─────────────────────────────────────────────────────────────────────────
// LOGIN / LOGOUT
// Login simples (usuário + senha), sem cadastro público — usuários só são
// criados pelo gerente na página "Usuários", igual ao app.py.
// ─────────────────────────────────────────────────────────────────────────

function configurarAuth() {
  qs('#btn-entrar').addEventListener('click', fazerLogin);
  qs('#li-senha').addEventListener('keydown', e => { if (e.key === 'Enter') fazerLogin(); });
}

async function fazerLogin() {
  const usuarioIn = qs('#li-usuario').value.trim();
  const senhaIn = qs('#li-senha').value;
  const btn = qs('#btn-entrar');
  mostrarMsg('#msg-login', 'error', '');

  if (!usuarioIn || !senhaIn) {
    mostrarMsg('#msg-login', 'error', 'Preencha usuário e senha.');
    return;
  }
  btn.disabled = true; btn.textContent = 'Entrando...';
  try {
    const usuarioNorm = usuarioIn.trim().toLowerCase();
    const usuario = await buscarUsuarioLogin(usuarioNorm);
    const senhaHash = await hashPw(senhaIn);

    if (!usuario || usuario.senha_hash !== senhaHash) {
      mostrarMsg('#msg-login', 'error', 'Usuário ou senha inválidos.');
    } else {
      STATE.usuario = { id: usuario.id, nome: usuario.nome, usuario: usuario.usuario, perfil: usuario.perfil };
      STATE.categoriaAtual = null;
      STATE.paginaAtual = null;
      STATE.dados = await carregarDados();
      await iniciarApp();
    }
  } catch (e) {
    console.error(e);
    mostrarMsg('#msg-login', 'error', `Erro ao entrar: ${escapeHtml(e.message)}`);
  } finally {
    btn.disabled = false; btn.textContent = 'Entrar';
  }
}

function fazerLogout() {
  STATE.usuario = null;
  STATE.categoriaAtual = null;
  STATE.paginaAtual = null;
  STATE.dados = { motoristas: [], veiculos: [], carretas: [], viagens: [], abastecimentos: [] };
  qs('#li-usuario').value = ''; qs('#li-senha').value = '';
  mostrarMsg('#msg-login', 'error', '');
  renderizarTela();
}
