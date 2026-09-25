// ─────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────
function somarPorChave(lista, chaveFn, valorFn) {
  const mapa = {};
  for (const item of lista) {
    const chave = chaveFn(item);
    mapa[chave] = (mapa[chave] || 0) + valorFn(item);
  }
  return mapa;
}
function somarDuasChaves(mapaA, mapaB) {
  const resultado = { ...mapaA };
  for (const [k, v] of Object.entries(mapaB)) resultado[k] = (resultado[k] || 0) + v;
  return resultado;
}

function renderDashboard() {
  const box = qs('#app');
  const viagens = viagensParaLista(STATE.dados);

  if (!viagens.length) {
    box.innerHTML = barraNavegacaoSuperior() + `<div class="alerta alerta-info">Nenhuma viagem lançada ainda. Lance a primeira em <b>Viagens</b>.</div>`;
    ligarBarraNavegacaoSuperior();
    return;
  }

  const abastecimentos = abastecimentosParaLista(STATE.dados);
  const datas = viagens.map(v => parseISO(v.data));
  const dataMin = new Date(Math.min(...datas.map(d => d.getTime())));
  const dataMax = new Date(Math.max(...datas.map(d => d.getTime())));

  const placas = [...new Set(viagens.map(v => v.veiculo))].sort();
  const motoristasNomes = [...new Set(viagens.map(v => v.motorista))].sort();

  box.innerHTML = `
    ${barraNavegacaoSuperior()}
    <div class="page-title">Dashboard</div>
    <div class="section-title">Filtros</div>
    <div class="form-row cols-4">
      <div class="field"><label>Data inicial</label><input type="date" id="dash-data-ini" value="${dataISO(dataMin)}"></div>
      <div class="field"><label>Data final</label><input type="date" id="dash-data-fim" value="${dataISO(dataMax)}"></div>
      <div class="field"><label>Caminhão</label><select id="dash-veiculo"><option value="Todos">Todos</option>${placas.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}</select></div>
      <div class="field"><label>Motorista</label><select id="dash-motorista"><option value="Todos">Todos</option>${motoristasNomes.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('')}</select></div>
    </div>
    <div id="dash-conteudo"></div>
  `;
  ligarBarraNavegacaoSuperior();

  ['dash-data-ini','dash-data-fim','dash-veiculo','dash-motorista'].forEach(id => {
    qs('#' + id).addEventListener('change', renderDashboardConteudo);
  });

  renderDashboardConteudo();
}

function renderDashboardConteudo() {
  const conteudo = qs('#dash-conteudo');
  const dataIni = parseISO(qs('#dash-data-ini').value);
  const dataFim = parseISO(qs('#dash-data-fim').value);
  const veiculoSel = qs('#dash-veiculo').value;
  const motoristaSel = qs('#dash-motorista').value;

  let viagens = viagensParaLista(STATE.dados).filter(v => {
    const d = parseISO(v.data);
    return d >= dataIni && d <= dataFim;
  });
  if (veiculoSel !== 'Todos') viagens = viagens.filter(v => v.veiculo === veiculoSel);
  if (motoristaSel !== 'Todos') viagens = viagens.filter(v => v.motorista === motoristaSel);

  let abastecimentos = abastecimentosParaLista(STATE.dados).filter(a => {
    const d = parseISO(a.data);
    return d >= dataIni && d <= dataFim;
  });
  if (veiculoSel !== 'Todos') abastecimentos = abastecimentos.filter(a => a.veiculo === veiculoSel);
  if (motoristaSel !== 'Todos') abastecimentos = abastecimentos.filter(a => a.motorista === motoristaSel);

  const receitaTotal = viagens.reduce((s, v) => s + v.faturamento, 0);
  const despesaViagens = viagens.reduce((s, v) => s + v.pedagio + v.outros_custos, 0);
  const despesaCombustivel = abastecimentos.reduce((s, a) => s + a.valor_pago, 0);
  const despesaTotal = despesaViagens + despesaCombustivel;
  const lucroTotal = receitaTotal - despesaTotal;

  let html = `<div class="kpi-row" style="margin-top:14px;">
    <div class="kpi verde"><div class="kpi-label">Receita Total</div><div class="kpi-value pos">${fmtBRL(receitaTotal)}</div></div>
    <div class="kpi vermelho"><div class="kpi-label">Despesa Total</div><div class="kpi-value neg">${fmtBRL(despesaTotal)}</div></div>
    <div class="kpi amarelo"><div class="kpi-label">Lucro (Receita - Despesa)</div><div class="kpi-value ${lucroTotal >= 0 ? 'pos' : 'neg'}">${fmtBRL(lucroTotal)}</div></div>
    <div class="kpi roxo"><div class="kpi-label">Viagens Lançadas</div><div class="kpi-value neu">${viagens.length}</div></div>
  </div>`;

  html += `<div class="divider"></div><div class="section-title">Receita, Despesa e Lucro por Caminhão e por Motorista</div>
    <div class="two-col">
      <div><div class="caption">Por Caminhão</div><div class="chart-box"><canvas id="chart-rdl-veiculo"></canvas></div></div>
      <div><div class="caption">Por Motorista</div><div class="chart-box"><canvas id="chart-rdl-motorista"></canvas></div></div>
    </div>`;

  html += `<div class="divider"></div><div class="section-title">Receita, Despesa e Lucro por Mês</div>
    <div class="chart-box"><canvas id="chart-rdl-mes"></canvas></div>`;

  html += `<div class="divider"></div><div class="section-title">Quantidade de Viagens Lançadas</div>
    <div class="two-col">
      <div><div class="caption">Por Mês</div><div class="chart-box"><canvas id="chart-qtd-mes"></canvas></div></div>
      <div><div class="caption">Por Caminhão</div><div class="chart-box"><canvas id="chart-qtd-veiculo"></canvas></div></div>
    </div>`;

  html += `<div class="divider"></div><div class="section-title">Custo por KM Rodado (por Caminhão)</div>
    <div id="dash-custo-km"></div>`;

  html += `<div class="divider"></div><div class="section-title">Últimas viagens lançadas</div>
    <div id="dash-ultimas"></div>`;

  conteudo.innerHTML = html;

  // Receita/Despesa/Lucro por Caminhão
  const receitaVeiculo = somarPorChave(viagens, v => v.veiculo, v => v.faturamento);
  const despesaVeiculoViagem = somarPorChave(viagens, v => v.veiculo, v => v.pedagio + v.outros_custos);
  const despesaVeiculoComb = somarPorChave(abastecimentos, a => a.veiculo, a => a.valor_pago);
  const despesaVeiculo = somarDuasChaves(despesaVeiculoViagem, despesaVeiculoComb);
  const catsVeiculo = [...new Set([...Object.keys(receitaVeiculo), ...Object.keys(despesaVeiculo)])].sort();
  graficoRdlEmpilhado('chart-rdl-veiculo', catsVeiculo, catsVeiculo.map(c => receitaVeiculo[c] || 0), catsVeiculo.map(c => despesaVeiculo[c] || 0));

  // Receita/Despesa/Lucro por Motorista
  const receitaMotorista = somarPorChave(viagens, v => v.motorista, v => v.faturamento);
  const despesaMotoristaViagem = somarPorChave(viagens, v => v.motorista, v => v.pedagio + v.outros_custos);
  const despesaMotoristaComb = somarPorChave(abastecimentos, a => a.motorista, a => a.valor_pago);
  const despesaMotorista = somarDuasChaves(despesaMotoristaViagem, despesaMotoristaComb);
  const catsMotorista = [...new Set([...Object.keys(receitaMotorista), ...Object.keys(despesaMotorista)])].sort();
  graficoRdlEmpilhado('chart-rdl-motorista', catsMotorista, catsMotorista.map(c => receitaMotorista[c] || 0), catsMotorista.map(c => despesaMotorista[c] || 0));

  // Receita/Despesa/Lucro por Mês
  const mesAnoFn = iso => { const d = parseISO(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
  const receitaMes = somarPorChave(viagens, v => mesAnoFn(v.data), v => v.faturamento);
  const despesaMesViagem = somarPorChave(viagens, v => mesAnoFn(v.data), v => v.pedagio + v.outros_custos);
  const despesaMesComb = somarPorChave(abastecimentos, a => mesAnoFn(a.data), a => a.valor_pago);
  const despesaMes = somarDuasChaves(despesaMesViagem, despesaMesComb);
  const catsMes = [...new Set([...Object.keys(receitaMes), ...Object.keys(despesaMes)])].sort();
  graficoRdlEmpilhado('chart-rdl-mes', catsMes, catsMes.map(c => receitaMes[c] || 0), catsMes.map(c => despesaMes[c] || 0));

  // Quantidade por Mês / por Caminhão
  const qtdMes = somarPorChave(viagens, v => mesAnoFn(v.data), () => 1);
  const catsQtdMes = Object.keys(qtdMes).sort();
  graficoQuantidade('chart-qtd-mes', catsQtdMes, catsQtdMes.map(c => qtdMes[c]));

  const qtdVeiculo = somarPorChave(viagens, v => v.veiculo, () => 1);
  const catsQtdVeiculo = Object.keys(qtdVeiculo).sort();
  graficoQuantidade('chart-qtd-veiculo', catsQtdVeiculo, catsQtdVeiculo.map(c => qtdVeiculo[c]));

  // Custo por KM rodado
  const kmVeiculo = somarPorChave(abastecimentos.filter(a => a.km_rodado != null && a.km_rodado > 0), a => a.veiculo, a => a.km_rodado);
  const linhasCustoKm = [];
  for (const veic of Object.keys(despesaVeiculo)) {
    const kmTotal = kmVeiculo[veic] || 0;
    if (kmTotal > 0) linhasCustoKm.push({ veiculo: veic, custo_por_km: despesaVeiculo[veic] / kmTotal });
  }
  const boxCustoKm = qs('#dash-custo-km');
  if (linhasCustoKm.length) {
    linhasCustoKm.sort((a, b) => b.custo_por_km - a.custo_por_km);
    boxCustoKm.innerHTML = `<div class="chart-box"><canvas id="chart-custo-km"></canvas></div>`;
    graficoCustoKm('chart-custo-km', linhasCustoKm.map(l => l.veiculo), linhasCustoKm.map(l => l.custo_por_km));
  } else {
    boxCustoKm.innerHTML = `<div class="alerta alerta-info">Sem quilometragem suficiente registrada (é necessário ao menos 2 abastecimentos por caminhão dentro do filtro selecionado) para calcular o custo por KM.</div>`;
  }

  // Últimas viagens
  const todasViagens = viagensParaLista(STATE.dados);
  const ultimas = [...todasViagens].sort((a, b) => parseISO(b.data) - parseISO(a.data)).slice(0, 6);
  const boxUltimas = qs('#dash-ultimas');
  if (!ultimas.length) {
    boxUltimas.innerHTML = `<div class="alerta alerta-info">Nenhuma viagem lançada.</div>`;
  } else {
    boxUltimas.innerHTML = `<table class="tabela-simples"><thead><tr>
      <th>Data</th><th>Cavalo</th><th>Motorista</th><th>Origem</th><th>Destino</th><th>Faturamento</th><th>Status</th>
    </tr></thead><tbody>${ultimas.map(v => `<tr>
      <td>${fmtDataBR(v.data)}</td><td>${escapeHtml(v.veiculo)}</td><td>${escapeHtml(v.motorista)}</td>
      <td>${escapeHtml(v.origem)}</td><td>${escapeHtml(v.destino)}</td>
      <td class="lanc-valor pos">${fmtBRL(v.faturamento)}</td><td>${badgeStatus(v.status)}</td>
    </tr>`).join('')}</tbody></table>`;
  }
}
