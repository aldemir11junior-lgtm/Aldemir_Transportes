// ─────────────────────────────────────────────────────────────────────────
// VIAGENS — Nova viagem + Lançamentos (editar/excluir/exportar)
// ─────────────────────────────────────────────────────────────────────────
let VIAGENS_SUBABA = 'nova';

function renderViagens() {
  const box = qs('#app');
  box.innerHTML = `
    ${barraNavegacaoSuperior()}
    <div class="page-title">Viagens</div>
    <div class="login-abas" style="max-width:420px;">
      <button class="login-aba-btn ${VIAGENS_SUBABA === 'nova' ? 'active' : ''}" data-sub="nova">Nova viagem</button>
      <button class="login-aba-btn ${VIAGENS_SUBABA === 'lista' ? 'active' : ''}" data-sub="lista">Lançamentos</button>
    </div>
    <div id="viagens-corpo"></div>
  `;
  ligarBarraNavegacaoSuperior();
  qsa('[data-sub]', box).forEach(btn => btn.addEventListener('click', () => { VIAGENS_SUBABA = btn.dataset.sub; renderViagens(); }));

  if (VIAGENS_SUBABA === 'nova') renderFormularioViagem(qs('#viagens-corpo'), null, () => { VIAGENS_SUBABA = 'lista'; renderViagens(); });
  else renderListaViagens();
}

// Renderiza o formulário de nova/edição de viagem dentro do `container` informado.
// `aoSalvar` é chamado depois de salvar com sucesso (deixa quem chamou decidir o que fazer a seguir).
async function renderFormularioViagem(container, viagem, aoSalvar) {
  const motoristas = STATE.dados.motoristas;
  const veiculos = STATE.dados.veiculos;
  const carretas = STATE.dados.carretas;
  const modelosDisponiveis = [...new Set(carretas.map(c => (c.modelo || '').trim()).filter(Boolean))].sort();

  if (!motoristas.length || !veiculos.length || !modelosDisponiveis.length) {
    container.innerHTML = `<div class="alerta alerta-warning">Cadastre ao menos um motorista, um cavalo (frota) e uma carreta com modelo preenchido antes de lançar uma viagem.</div>`;
    return;
  }

  const sufixo = viagem ? viagem.id : 'novo';
  container.innerHTML = `<div id="viagem-msg-${sufixo}"></div><div id="viagem-form-${sufixo}">Carregando cidades...</div>`;

  const cidades = await carregarCidadesBrasil();
  const formBox = qs(`#viagem-form-${sufixo}`, container);
  if (!formBox) return; // usuário já navegou para outra tela enquanto carregava

  const origemAtual = viagem ? viagem.origem : (cidades.includes('Três Lagoas - MS') ? 'Três Lagoas - MS' : (cidades[0] || ''));
  const destinoAtual = viagem ? viagem.destino : (cidades[0] || '');

  const campoOrigem = cidades.length
    ? `<select id="vg-origem-${sufixo}">${cidades.map(c => `<option value="${escapeHtml(c)}" ${c === origemAtual ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}</select>`
    : `<input type="text" id="vg-origem-${sufixo}" value="${escapeHtml(viagem ? viagem.origem : '')}">`;
  const campoDestino = cidades.length
    ? `<select id="vg-destino-${sufixo}">${cidades.map(c => `<option value="${escapeHtml(c)}" ${c === destinoAtual ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}</select>`
    : `<input type="text" id="vg-destino-${sufixo}" value="${escapeHtml(viagem ? viagem.destino : '')}">`;

  formBox.innerHTML = `
    <div class="form-row cols-2">
      <div class="field"><label>Data da viagem *</label><input type="date" id="vg-data-${sufixo}" value="${viagem ? viagem.data.slice(0,10) : dataISO(hojeBr())}"></div>
      <div class="field"><label>Status *</label><select id="vg-status-${sufixo}">${Object.entries(STATUS_OPCOES).map(([k, v]) => `<option value="${k}" ${viagem && viagem.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
    </div>
    <div class="form-row cols-2">
      <div class="field"><label>Origem *</label>${campoOrigem}</div>
      <div class="field"><label>Destino *</label>${campoDestino}</div>
    </div>
    <div class="form-row cols-2">
      <div class="field"><label>Cavalo (Frota) *</label><select id="vg-veiculo-${sufixo}">${veiculos.map(v => `<option value="${v.id}" ${viagem && viagem.veiculo_id === v.id ? 'selected' : ''}>${escapeHtml(v.placa)} — ${escapeHtml(v.modelo || '')}</option>`).join('')}</select></div>
      <div class="field"><label>Modelo da Carreta *</label><select id="vg-carreta-${sufixo}">${modelosDisponiveis.map(m => `<option value="${escapeHtml(m)}" ${viagem && viagem.carreta_modelo === m ? 'selected' : ''}>${escapeHtml(m)}</option>`).join('')}</select></div>
    </div>
    <div class="form-row cols-2">
      <div class="field"><label>Motorista *</label><select id="vg-motorista-${sufixo}">${motoristas.map(m => `<option value="${m.id}" ${viagem && viagem.motorista_id === m.id ? 'selected' : ''}>${escapeHtml(m.nome)}</option>`).join('')}</select></div>
      <div class="field"><label>Volume transportado (toneladas)</label><input type="number" min="0" step="0.1" id="vg-volume-${sufixo}" value="${viagem ? viagem.volume_tons : 0}"></div>
    </div>
    <div class="form-row cols-2">
      <div class="field"><label>Adiantamento de faturamento (R$) *</label><input type="number" min="0" step="100" id="vg-adiantamento-${sufixo}" value="${viagem ? viagem.faturamento_adiantamento : 0}"></div>
      <div class="field"><label>Restante do faturamento (R$)</label><input type="number" min="0" step="100" id="vg-restante-${sufixo}" value="${viagem ? viagem.faturamento_restante : 0}"></div>
    </div>
    <div class="form-row cols-2">
      <div class="field"><label>Pedágio (R$)</label><input type="number" min="0" step="10" id="vg-pedagio-${sufixo}" value="${viagem ? viagem.pedagio : 0}"></div>
      <div class="field"><label>Outros custos (R$)</label><input type="number" min="0" step="10" id="vg-outros-${sufixo}" value="${viagem ? viagem.outros_custos : 0}"></div>
    </div>
    <div class="field"><label>Observações</label><textarea id="vg-obs-${sufixo}" rows="2">${escapeHtml(viagem ? viagem.observacoes : '')}</textarea></div>
    <button class="btn btn-primary btn-block" id="vg-salvar-${sufixo}">Salvar viagem</button>
  `;

  qs(`#vg-salvar-${sufixo}`).addEventListener('click', () => salvarViagem(container, viagem, sufixo, aoSalvar));
}

async function salvarViagem(container, viagem, sufixo, aoSalvar) {
  const msgBox = qs(`#viagem-msg-${sufixo}`, container);
  const origem = qs(`#vg-origem-${sufixo}`, container).value.trim();
  const destino = qs(`#vg-destino-${sufixo}`, container).value.trim();
  const adiantamento = parseFloat(qs(`#vg-adiantamento-${sufixo}`, container).value) || 0;
  const volume = parseFloat(qs(`#vg-volume-${sufixo}`, container).value) || 0;

  const erros = [];
  if (!origem || !destino) erros.push('Informe origem e destino.');
  if (adiantamento <= 0) erros.push('Informe o valor do adiantamento de faturamento.');
  if (volume <= 0) erros.push('Informe o volume transportado (toneladas).');
  if (erros.length) { msgBox.innerHTML = erros.map(e => `<div class="alerta alerta-error">${escapeHtml(e)}</div>`).join(''); return; }

  const registro = {
    data: qs(`#vg-data-${sufixo}`, container).value,
    veiculo_id: parseInt(qs(`#vg-veiculo-${sufixo}`, container).value),
    carreta_modelo: qs(`#vg-carreta-${sufixo}`, container).value,
    motorista_id: parseInt(qs(`#vg-motorista-${sufixo}`, container).value),
    origem, destino,
    volume_tons: volume,
    faturamento_adiantamento: adiantamento,
    faturamento_restante: parseFloat(qs(`#vg-restante-${sufixo}`, container).value) || 0,
    pedagio: parseFloat(qs(`#vg-pedagio-${sufixo}`, container).value) || 0,
    outros_custos: parseFloat(qs(`#vg-outros-${sufixo}`, container).value) || 0,
    status: qs(`#vg-status-${sufixo}`, container).value,
    observacoes: qs(`#vg-obs-${sufixo}`, container).value.trim(),
  };

  const btn = qs(`#vg-salvar-${sufixo}`, container);
  btn.disabled = true; btn.textContent = 'Salvando...';
  try {
    if (!viagem) {
      registro.criado_por_id = STATE.usuario.id;
      await criarViagem(registro);
    } else {
      await atualizarViagem(viagem.id, registro);
    }
    await atualizarDados();
    if (aoSalvar) aoSalvar();
  } catch (e) {
    msgBox.innerHTML = `<div class="alerta alerta-error">Erro ao salvar: ${escapeHtml(e.message)}</div>`;
    btn.disabled = false; btn.textContent = 'Salvar viagem';
  }
}

function renderListaViagens() {
  const box = qs('#viagens-corpo');
  const lista = viagensParaLista(STATE.dados).sort((a, b) => parseISO(b.data) - parseISO(a.data));

  if (!lista.length) {
    box.innerHTML = `<div class="alerta alerta-info">Nenhuma viagem cadastrada ainda.</div>`;
    return;
  }

  box.innerHTML = `
    <table class="tabela-simples"><thead><tr>
      <th>ID</th><th>Data</th><th>Cavalo</th><th>Carreta</th><th>Motorista</th><th>Origem</th><th>Destino</th>
      <th>Volume (T)</th><th>Faturamento</th><th>Custo</th><th>Status</th>
    </tr></thead><tbody>${lista.map(v => `<tr>
      <td>${v.id}</td><td>${fmtDataBR(v.data)}</td><td>${escapeHtml(v.veiculo)}</td><td>${escapeHtml(v.carreta)}</td>
      <td>${escapeHtml(v.motorista)}</td><td>${escapeHtml(v.origem)}</td><td>${escapeHtml(v.destino)}</td>
      <td>${formatarNumero(v.volume_tons, 1)}</td><td class="lanc-valor pos">${fmtBRL(v.faturamento)}</td>
      <td class="lanc-valor neg">${fmtBRL(v.custo_total)}</td><td>${badgeStatus(v.status)}</td>
    </tr>`).join('')}</tbody></table>

    <div class="divider"></div>
    <div class="section-title">Editar ou excluir uma viagem</div>
    <div class="field" style="max-width:420px;"><label>Selecione pelo ID</label>
      <select id="vg-sel-id">${lista.map(v => `<option value="${v.id}">#${v.id} — ${escapeHtml(v.origem)} → ${escapeHtml(v.destino)}</option>`).join('')}</select>
    </div>
    <div class="form-row cols-2">
      <button class="btn" id="vg-btn-editar">Editar esta viagem</button>
      ${STATE.usuario.perfil === 'gerente' ? '<button class="btn btn-danger" id="vg-btn-excluir">Excluir viagem selecionada</button>' : ''}
    </div>
    <div id="vg-editor"></div>

    <div class="divider"></div>
    <div class="section-title">Exportar</div>
    <div class="form-row cols-3">
      <button class="btn" id="vg-exp-csv">CSV</button>
      <button class="btn" id="vg-exp-xlsx">Excel</button>
      <button class="btn" id="vg-exp-print">Imprimir / PDF</button>
    </div>
  `;

  qs('#vg-btn-editar').addEventListener('click', () => {
    const id = parseInt(qs('#vg-sel-id').value);
    const viagem = buscarPorId(STATE.dados.viagens, id);
    const editorBox = qs('#vg-editor');
    editorBox.innerHTML = `<div class="divider"></div><div class="section-title">Editando viagem #${id}</div>`;
    const holder = el('<div></div>');
    editorBox.appendChild(holder);
    renderFormularioViagem(holder, viagem, () => { renderListaViagens(); });
  });

  qs('#vg-btn-excluir')?.addEventListener('click', async () => {
    const id = parseInt(qs('#vg-sel-id').value);
    if (!confirm(`Excluir a viagem #${id}? Essa ação não pode ser desfeita.`)) return;
    try {
      await excluirViagem(id);
      await atualizarDados();
      renderListaViagens();
    } catch (e) { alert('Erro ao excluir: ' + e.message); }
  });

  qs('#vg-exp-csv').addEventListener('click', () => gerarCsv(lista, CABECALHO_EXPORT, COLUNAS_EXPORT, 'viagens.csv'));
  qs('#vg-exp-xlsx').addEventListener('click', () => gerarXlsx(lista, CABECALHO_EXPORT, COLUNAS_EXPORT, 'viagens.xlsx', 'Viagens'));
  qs('#vg-exp-print').addEventListener('click', () => imprimirTabela('Relatório de Viagens — Aldemir Transportes', lista, CABECALHO_EXPORT, COLUNAS_EXPORT));
}
