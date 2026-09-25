// ─────────────────────────────────────────────────────────────────────────
// MANUTENÇÃO — placeholder (mesmo estado do app.py: "Módulo em construção")
// ─────────────────────────────────────────────────────────────────────────
function renderManutencao() {
  const box = qs('#app');
  box.innerHTML = `
    ${barraNavegacaoSuperior()}
    <div class="page-title">Manutenção</div>
    <div class="alerta alerta-info">Módulo em construção.</div>
  `;
  ligarBarraNavegacaoSuperior();
}
