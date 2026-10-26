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

  const hoje = hojeBr();
  const dataInicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const dataFimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  const placas = [...new Set(viagens.map(v => v.veiculo))].sort();
  const motoristasNomes = [...new Set(viagens.map(v => v.motorista))].sort();

  box.innerHTML = `
    ${barraNavegacaoSuperior()}
    <div class="page-title">Dashboard</div>
    <div class="section-title">Filtros</div>
    <div class="form-row cols-4">
      <div class="field"><label>Data inicial</label><input type="date" id="dash-data-ini" value="${dataISO(dataInicioMes)}"></div>
      <div class="field"><label>Data final</label><input type="date" id="dash-data-fim" value="${dataISO(dataFimMes)}"></div>
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

  html += `<div class="divider"></div><div class="section-title">Receita, Despesa e Lucro por Mês</div>
    <div class="chart-box"><canvas id="chart-rdl-mes"></canvas></div>`;

  html += `<div class="divider"></div><div class="section-title">Quantidade de Viagens Lançadas</div>
    <div class="chart-box"><canvas id="chart-qtd-mes"></canvas></div>`;

  html += `<div class="divider"></div><div class="section-title">Custo por KM Rodado por Mês</div>
    <div id="dash-custo-km"></div>`;

  html += `<div class="divider"></div><div class="section-title">Últimas viagens lançadas</div>
    <div id="dash-ultimas"></div>`;

  conteudo.innerHTML = html;

  // Receita/Despesa/Lucro por Mês
  const mesAnoFn = iso => { const d = parseISO(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
  const rotuloMesAno = mesAno => {
    const [ano, mes] = mesAno.split('-').map(Number);
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[mes - 1]}/${String(ano).slice(-2)}`;
  };
  const viagensHistorico = viagensParaLista(STATE.dados).filter(v =>
    (veiculoSel === 'Todos' || v.veiculo === veiculoSel) &&
    (motoristaSel === 'Todos' || v.motorista === motoristaSel)
  );
  const abastecimentosHistorico = abastecimentosParaLista(STATE.dados).filter(a =>
    (veiculoSel === 'Todos' || a.veiculo === veiculoSel) &&
    (motoristaSel === 'Todos' || a.motorista === motoristaSel)
  );
  const receitaMes = somarPorChave(viagensHistorico, v => mesAnoFn(v.data), v => v.faturamento);
  const despesaMesViagem = somarPorChave(viagensHistorico, v => mesAnoFn(v.data), v => v.pedagio + v.outros_custos);
  const despesaMesComb = somarPorChave(abastecimentosHistorico, a => mesAnoFn(a.data), a => a.valor_pago);
  const despesaMes = somarDuasChaves(despesaMesViagem, despesaMesComb);
  const catsMes = [...new Set([...Object.keys(receitaMes), ...Object.keys(despesaMes)])].sort();
  const rotulosMes = catsMes.map(rotuloMesAno);
  graficoRdlColunas('chart-rdl-mes', rotulosMes, catsMes.map(c => receitaMes[c] || 0), catsMes.map(c => despesaMes[c] || 0));

  // A série mensal histórica não depende do filtro de datas.
  const qtdMes = somarPorChave(viagensHistorico, v => mesAnoFn(v.data), () => 1);
  const catsQtdMes = Object.keys(qtdMes).sort();
  graficoQuantidade('chart-qtd-mes', catsQtdMes.map(rotuloMesAno), catsQtdMes.map(c => qtdMes[c]));

  // Custo mensal por KM: despesas do mês divididas pelos KM registrados no mês.
  // Série histórica: não depende do filtro de datas (só de caminhão/motorista).
  const despesaKmMes = despesaMes;
  const kmMes = somarPorChave(
    abastecimentosHistorico.filter(a => a.km_rodado != null && a.km_rodado > 0),
    a => mesAnoFn(a.data),
    a => a.km_rodado
  );
  const catsCustoKm = Object.keys(kmMes).sort();
  const valoresCustoKm = catsCustoKm.map(mes => despesaKmMes[mes] / kmMes[mes]);
  const boxCustoKm = qs('#dash-custo-km');
  if (catsCustoKm.length) {
    boxCustoKm.innerHTML = `<div class="chart-box"><canvas id="chart-custo-km"></canvas></div>`;
    graficoCustoKm('chart-custo-km', catsCustoKm.map(rotuloMesAno), valoresCustoKm);
  } else {
    boxCustoKm.innerHTML = `<div class="alerta alerta-info">Sem quilometragem registrada para calcular o custo por KM mensal.</div>`;
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
