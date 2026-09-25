// ─────────────────────────────────────────────────────────────────────────
// COMBUSTÍVEL — Novo abastecimento + Lançamentos (sem anexo de foto)
// ─────────────────────────────────────────────────────────────────────────
let COMB_SUBABA = 'novo';

function renderCombustivel() {
  const box = qs('#app');
  box.innerHTML = `
    ${barraNavegacaoSuperior()}
    <div class="page-title">Combustível</div>
    <div class="login-abas" style="max-width:420px;">
      <button class="login-aba-btn ${COMB_SUBABA === 'novo' ? 'active' : ''}" data-sub="novo">Novo abastecimento</button>
      <button class="login-aba-btn ${COMB_SUBABA === 'lista' ? 'active' : ''}" data-sub="lista">Lançamentos</button>
    </div>
    <div id="comb-corpo"></div>
  `;
  ligarBarraNavegacaoSuperior();
  qsa('[data-sub]', box).forEach(btn => btn.addEventListener('click', () => { COMB_SUBABA = btn.dataset.sub; renderCombustivel(); }));

  if (COMB_SUBABA === 'novo') renderFormularioAbastecimento(qs('#comb-corpo'), null, () => { COMB_SUBABA = 'lista'; renderCombustivel(); });
  else renderListaAbastecimentos();
}

async function renderFormularioAbastecimento(container, abastecimento, aoSalvar) {
  const motoristas = STATE.dados.motoristas;
  const veiculos = STATE.dados.veiculos;

  if (!motoristas.length || !veiculos.length) {
    container.innerHTML = `<div class="alerta alerta-warning">Cadastre ao menos um motorista e um cavalo (frota) antes de lançar um abastecimento.</div>`;
    return;
  }

  const sufixo = abastecimento ? abastecimento.id : 'novo';
  container.innerHTML = `<div id="ab-msg-${sufixo}"></div><div id="ab-form-${sufixo}">Carregando cidades...</div>`;

  const cidades = await carregarCidadesBrasil();
  const formBox = qs(`#ab-form-${sufixo}`, container);
  if (!formBox) return;

  const cidadeAtual = abastecimento ? abastecimento.cidade : (cidades.includes('Três Lagoas - MS') ? 'Três Lagoas - MS' : (cidades[0] || ''));
  const campoCidade = cidades.length
    ? `<select id="ab-cidade-${sufixo}">${cidades.map(c => `<option value="${escapeHtml(c)}" ${c === cidadeAtual ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}</select>`
    : `<input type="text" id="ab-cidade-${sufixo}" value="${escapeHtml(abastecimento ? abastecimento.cidade : '')}">`;

  formBox.innerHTML = `
    <div class="form-row cols-2">
      <div class="field"><label>Data *</label><input type="date" id="ab-data-${sufixo}" value="${abastecimento ? abastecimento.data.slice(0,10) : dataISO(hojeBr())}"></div>
      <div class="field"><label>Cavalo (Frota) *</label><select id="ab-veiculo-${sufixo}">${veiculos.map(v => `<option value="${v.id}" ${abastecimento && abastecimento.veiculo_id === v.id ? 'selected' : ''}>${escapeHtml(v.placa)} — ${escapeHtml(v.modelo || '')}</option>`).join('')}</select></div>
    </div>
    <div class="form-row cols-2">
      <div class="field"><label>Motorista *</label><select id="ab-motorista-${sufixo}">${motoristas.map(m => `<option value="${m.id}" ${abastecimento && abastecimento.motorista_id === m.id ? 'selected' : ''}>${escapeHtml(m.nome)}</option>`).join('')}</select></div>
      <div class="field"><label>Cidade *</label>${campoCidade}</div>
    </div>
    <div class="form-row cols-3">
      <div class="field"><label>Litros *</label><input type="number" min="0" step="1" id="ab-litros-${sufixo}" value="${abastecimento ? abastecimento.litros : 0}"></div>
      <div class="field"><label>Valor pago (R$) *</label><input type="number" min="0" step="10" id="ab-valor-${sufixo}" value="${abastecimento ? abastecimento.valor_pago : 0}"></div>
      <div class="field"><label>Hodômetro (KM) *</label><input type="number" min="0" step="1" id="ab-hodometro-${sufixo}" value="${abastecimento ? abastecimento.hodometro : 0}"></div>
    </div>
    <button class="btn btn-primary btn-block" id="ab-salvar-${sufixo}">Salvar abastecimento</button>
  `;

  qs(`#ab-salvar-${sufixo}`).addEventListener('click', () => salvarAbastecimento(container, abastecimento, sufixo, aoSalvar));
}

async function salvarAbastecimento(container, abastecimento, sufixo, aoSalvar) {
  const msgBox = qs(`#ab-msg-${sufixo}`, container);
  const cidade = qs(`#ab-cidade-${sufixo}`, container).value.trim();
  const litros = parseFloat(qs(`#ab-litros-${sufixo}`, container).value) || 0;
  const valorPago = parseFloat(qs(`#ab-valor-${sufixo}`, container).value) || 0;
  const hodometro = parseFloat(qs(`#ab-hodometro-${sufixo}`, container).value) || 0;

  const erros = [];
  if (!cidade) erros.push('Informe a cidade.');
  if (litros <= 0) erros.push('Informe a quantidade de litros.');
  if (valorPago <= 0) erros.push('Informe o valor pago.');
  if (hodometro <= 0) erros.push('Informe o hodômetro.');
  if (erros.length) { msgBox.innerHTML = erros.map(e => `<div class="alerta alerta-error">${escapeHtml(e)}</div>`).join(''); return; }

  const registro = {
    data: qs(`#ab-data-${sufixo}`, container).value,
    veiculo_id: parseInt(qs(`#ab-veiculo-${sufixo}`, container).value),
    motorista_id: parseInt(qs(`#ab-motorista-${sufixo}`, container).value),
    litros, valor_pago: valorPago, hodometro, cidade,
  };

  const btn = qs(`#ab-salvar-${sufixo}`, container);
  btn.disabled = true; btn.textContent = 'Salvando...';
  try {
    if (!abastecimento) {
      registro.criado_por_id = STATE.usuario.id;
      await criarAbastecimento(registro);
    } else {
      await atualizarAbastecimento(abastecimento.id, registro);
    }
    await atualizarDados();
    if (aoSalvar) aoSalvar();
  } catch (e) {
    msgBox.innerHTML = `<div class="alerta alerta-error">Erro ao salvar: ${escapeHtml(e.message)}</div>`;
    btn.disabled = false; btn.textContent = 'Salvar abastecimento';
  }
}

function renderListaAbastecimentos() {
  const box = qs('#comb-corpo');
  const lista = abastecimentosParaLista(STATE.dados).sort((a, b) => parseISO(b.data) - parseISO(a.data));

  if (!lista.length) {
    box.innerHTML = `<div class="alerta alerta-info">Nenhum abastecimento cadastrado ainda.</div>`;
    return;
  }

  box.innerHTML = `
    <div class="form-row cols-3">
      <button class="btn" id="ab-exp-csv">CSV</button>
      <button class="btn" id="ab-exp-xlsx">Excel</button>
      <button class="btn" id="ab-exp-print">Imprimir / PDF</button>
    </div>
    <div class="divider"></div>
    <table class="tabela-simples"><thead><tr>
      <th>ID</th><th>Data</th><th>Veículo</th><th>Motorista</th><th>Litros</th><th>Valor Pago</th>
      <th>R$/Litro</th><th>Hodômetro</th><th>KM Rodado</th><th>Cidade</th>
    </tr></thead><tbody>${lista.map(a => `<tr>
      <td>${a.id}</td><td>${fmtDataBR(a.data)}</td><td>${escapeHtml(a.veiculo)}</td><td>${escapeHtml(a.motorista)}</td>
      <td>${formatarNumero(a.litros, 1)}</td><td>${fmtBRL(a.valor_pago)}</td><td>${formatarNumero(a.valor_por_litro, 3)}</td>
      <td>${formatarNumero(a.hodometro, 0)}</td><td>${a.km_rodado != null ? formatarNumero(a.km_rodado, 1) : '-'}</td>
      <td>${escapeHtml(a.cidade)}</td>
    </tr>`).join('')}</tbody></table>

    <div class="divider"></div>
    <div class="section-title">Editar ou excluir um abastecimento</div>
    <div class="field" style="max-width:420px;"><label>Selecione pelo ID</label>
      <select id="ab-sel-id">${lista.map(a => `<option value="${a.id}">#${a.id} — ${escapeHtml(a.cidade)} (${escapeHtml(a.veiculo)})</option>`).join('')}</select>
    </div>
    <div class="form-row cols-2">
      <button class="btn" id="ab-btn-editar">Editar este abastecimento</button>
      ${STATE.usuario.perfil === 'gerente' ? '<button class="btn btn-danger" id="ab-btn-excluir">Excluir abastecimento selecionado</button>' : ''}
    </div>
    <div id="ab-editor"></div>
  `;

  qs('#ab-btn-editar').addEventListener('click', () => {
    const id = parseInt(qs('#ab-sel-id').value);
    const abastecimento = buscarPorId(STATE.dados.abastecimentos, id);
    const editorBox = qs('#ab-editor');
    editorBox.innerHTML = `<div class="divider"></div><div class="section-title">Editando abastecimento #${id}</div>`;
    const holder = el('<div></div>');
    editorBox.appendChild(holder);
    renderFormularioAbastecimento(holder, abastecimento, () => { renderListaAbastecimentos(); });
  });

  qs('#ab-btn-excluir')?.addEventListener('click', async () => {
    const id = parseInt(qs('#ab-sel-id').value);
    if (!confirm(`Excluir o abastecimento #${id}? Essa ação não pode ser desfeita.`)) return;
    try {
      await excluirAbastecimento(id);
      await atualizarDados();
      renderListaAbastecimentos();
    } catch (e) { alert('Erro ao excluir: ' + e.message); }
  });

  qs('#ab-exp-csv').addEventListener('click', () => gerarCsv(lista, CABECALHO_EXPORT_COMBUSTIVEL, COLUNAS_EXPORT_COMBUSTIVEL, 'abastecimentos.csv'));
  qs('#ab-exp-xlsx').addEventListener('click', () => gerarXlsx(lista, CABECALHO_EXPORT_COMBUSTIVEL, COLUNAS_EXPORT_COMBUSTIVEL, 'abastecimentos.xlsx', 'Abastecimentos'));
  qs('#ab-exp-print').addEventListener('click', () => imprimirTabela('Relatório de Abastecimentos — Aldemir Transportes', lista, CABECALHO_EXPORT_COMBUSTIVEL, COLUNAS_EXPORT_COMBUSTIVEL));
}
