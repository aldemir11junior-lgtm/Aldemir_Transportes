// ─────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────
function renderDashboard() {
  const container = qs('#page-Dashboard');
  const lancamentos = STATE.lancamentos;

  let dataMinDados = hojeBr();
  dataMinDados.setDate(1);
  if (lancamentos.length) {
    const datas = lancamentos.map(l => parseISO(l.data));
    dataMinDados = new Date(Math.min(...datas.map(d => d.getTime())));
  }
  if (!STATE.filtroInicio) STATE.filtroInicio = dataMinDados;
  if (!STATE.filtroFim) STATE.filtroFim = hojeBr();

  container.innerHTML = `
    <div class="page-title">Visão <span>Geral</span></div>
    <div class="page-sub">Atualizado em ${agoraBr().toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
    <div class="divider"></div>

    <div class="section-title">🗓️ Filtrar Período de Análise</div>
    <div class="form-row cols-3">
      <div class="field"><label>📅 Data inicial</label><input type="date" id="db-data-inicio" value="${dataISO(STATE.filtroInicio)}"></div>
      <div class="field"><label>📅 Data final</label><input type="date" id="db-data-fim" value="${dataISO(STATE.filtroFim)}"></div>
      <div class="field">
        <label>Atalhos rápidos</label>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-sm" id="db-at-mes">Este mês</button>
          <button class="btn btn-sm" id="db-at-3m">Últ. 3 meses</button>
          <button class="btn btn-sm" id="db-at-ano">Este ano</button>
        </div>
      </div>
    </div>
    <div id="db-aviso-data"></div>
    <div id="db-conteudo"></div>
  `;

  qs('#db-data-inicio').addEventListener('change', e => { STATE.filtroInicio = parseISO(e.target.value); renderDashboardConteudo(); });
  qs('#db-data-fim').addEventListener('change', e => { STATE.filtroFim = parseISO(e.target.value); renderDashboardConteudo(); });
  qs('#db-at-mes').addEventListener('click', () => {
    const h = hojeBr(); STATE.filtroInicio = new Date(h.getFullYear(), h.getMonth(), 1); STATE.filtroFim = hojeBr();
    qs('#db-data-inicio').value = dataISO(STATE.filtroInicio); qs('#db-data-fim').value = dataISO(STATE.filtroFim);
    renderDashboardConteudo();
  });
  qs('#db-at-3m').addEventListener('click', () => {
    const h = hojeBr(); STATE.filtroInicio = new Date(h.getTime() - 90 * 86400000); STATE.filtroFim = hojeBr();
    qs('#db-data-inicio').value = dataISO(STATE.filtroInicio); qs('#db-data-fim').value = dataISO(STATE.filtroFim);
    renderDashboardConteudo();
  });
  qs('#db-at-ano').addEventListener('click', () => {
    const h = hojeBr(); STATE.filtroInicio = new Date(h.getFullYear(), 0, 1); STATE.filtroFim = hojeBr();
    qs('#db-data-inicio').value = dataISO(STATE.filtroInicio); qs('#db-data-fim').value = dataISO(STATE.filtroFim);
    renderDashboardConteudo();
  });

  renderDashboardConteudo();
}

let DB_TOP_N = 5;

function renderDashboardConteudo() {
  const avisoBox = qs('#db-aviso-data');
  const box = qs('#db-conteudo');
  const lancamentos = STATE.lancamentos;

  if (STATE.filtroInicio > STATE.filtroFim) {
    avisoBox.innerHTML = `<div class="alerta alerta-warning">⚠️ A data inicial não pode ser maior que a data final.</div>`;
    box.innerHTML = '';
    return;
  }
  avisoBox.innerHTML = '';

  const noPeriodo = l => { const d = parseISO(l.data); return d >= STATE.filtroInicio && d <= STATE.filtroFim; };
  const lancFiltrados = lancamentos.filter(noPeriodo);
  const receitas = lancFiltrados.filter(l => l.tipo === 'Receita');
  const despesas = lancFiltrados.filter(l => l.tipo !== 'Receita');
  const fixos = despesas.filter(l => l.tipo === 'Fixo');
  const variaveis = despesas.filter(l => l.tipo === 'Variável');

  const totalR = receitas.reduce((s, l) => s + l.valor, 0);
  const totalD = despesas.reduce((s, l) => s + l.valor, 0);
  const saldo = totalR - totalD;

  const periodoLabel = `${dataISO(STATE.filtroInicio).split('-').reverse().join('/')} → ${dataISO(STATE.filtroFim).split('-').reverse().join('/')}`;

  let html = `<div style="font-size:0.75rem;color:var(--text-sub);margin:6px 0 14px;">📌 Período: <b>${periodoLabel}</b> · ${lancFiltrados.length} lançamentos encontrados</div>`;

  const saldoCls = saldo >= 0 ? 'pos' : 'neg';
  const saldoBor = saldo >= 0 ? 'verde' : 'vermelho';
  html += `<div class="kpi-row">
    <div class="kpi verde"><div class="kpi-label">Receitas</div><div class="kpi-value pos">${fmtBRL(totalR)}</div><div class="kpi-sub">${receitas.length} lançamentos</div></div>
    <div class="kpi vermelho"><div class="kpi-label">Despesas</div><div class="kpi-value neg">${fmtBRL(totalD)}</div><div class="kpi-sub">${despesas.length} lançamentos</div></div>
    <div class="kpi ${saldoBor}"><div class="kpi-label">Saldo</div><div class="kpi-value ${saldoCls}">${fmtBRL(saldo)}</div><div class="kpi-sub">Receitas – Despesas</div></div>
  </div><div class="divider"></div>`;

  // Evolução mensal (ano atual)
  const anoAtual = hojeBr().getFullYear();
  const lancAnoAtual = lancamentos.filter(l => parseISO(l.data).getFullYear() === anoAtual);
  const temEvolucao = lancAnoAtual.length > 0;
  if (temEvolucao) {
    html += `<div class="section-title">Evolução Mensal — ${anoAtual}</div>
      <div class="chart-box"><canvas id="chart-evolucao"></canvas></div><div class="divider"></div>`;
  }

  // Pareto por classe
  const classeMap = {};
  for (const l of despesas) classeMap[l.classe] = (classeMap[l.classe] || 0) + l.valor;
  const temPareto = despesas.length > 0;
  if (temPareto) {
    html += `<div class="section-title">Análise de Pareto — Despesas por Categoria</div>
      <div class="caption">As barras mostram o valor absoluto por categoria; a linha amarela indica o percentual acumulado.</div>
      <div class="chart-box"><canvas id="chart-pareto"></canvas></div>`;
  }

  // Top despesas por descrição
  if (despesas.length) {
    html += `<div class="section-title">Top Itens de Despesa</div>
      <div style="display:flex;justify-content:flex-end;margin-bottom:8px;">
        <select id="db-top-n" class="field" style="width:120px;padding:6px 8px;border-radius:8px;border:1.5px solid var(--border);">
          <option value="5">Top 5</option><option value="10">Top 10</option><option value="15">Top 15</option><option value="20">Top 20</option>
        </select>
      </div>
      <div class="chart-box"><canvas id="chart-top-despesas"></canvas></div><div class="divider"></div>`;
  }

  // Donuts
  if (despesas.length || receitas.length) {
    html += `<div class="two-col">
      <div><div class="section-title">Composição das Despesas</div><div class="chart-box"><canvas id="chart-donut-fv"></canvas></div></div>
      <div><div class="section-title">Receita vs Despesa</div><div class="chart-box"><canvas id="chart-donut-rd"></canvas></div></div>
    </div>`;
  }

  // Dia da semana
  if (despesas.length) {
    html += `<div class="divider"></div><div class="section-title">Padrão de Gastos — Dia da Semana</div>
      <div class="chart-box"><canvas id="chart-semana"></canvas></div>`;
  }

  // Saldo acumulado
  if (lancFiltrados.length) {
    html += `<div class="section-title">Saúde Financeira — Saldo Acumulado</div>
      <div class="chart-box"><canvas id="chart-acumulado"></canvas></div>`;
  }

  // Gastos por categoria (cards)
  const catsOrdenadas = Object.entries(classeMap).sort((a, b) => b[1] - a[1]);
  if (despesas.length) {
    const maxVal = catsOrdenadas.length ? catsOrdenadas[0][1] : 1;
    const icons = { "Alimentação":"🍽️","Transporte":"🚗","Moradia":"🏠","Saúde":"💊","Lazer":"🎉","Educação":"📚","Serviços":"📡","Vestuário":"👗","Outros":"📌" };
    html += `<div class="divider"></div><div class="section-title">Gastos por Categoria</div><div class="cat-grid">`;
    for (const [cls, val] of catsOrdenadas) {
      const pct = Math.round((val / maxVal) * 100);
      html += `<div class="cat-card">
        <div class="icone">${icons[cls] || '📌'}</div>
        <div class="nome">${escapeHtml(cls)}</div>
        <div class="valor">${fmtBRL(val)}</div>
        <div class="barra-fundo thin"><div class="barra-cheia thin" style="width:${pct}%;background:#00704A;"></div></div>
      </div>`;
    }
    html += `</div>`;
  }

  // Categoria extra
  const despesasComCatExtra = despesas.filter(l => l.categoria_extra);
  if (despesasComCatExtra.length) {
    html += `<div class="divider"></div><div class="section-title">🏷️ Gastos por Categoria</div>
      <div class="caption">Segmentação extra informada nos lançamentos (ex: Moto, Carro, Casa).</div>
      <div class="chart-box"><canvas id="chart-cat-extra"></canvas></div>`;
  }

  // Últimos lançamentos
  html += `<div class="divider"></div><div class="section-title">Últimos Lançamentos no Período</div>`;
  if (!lancFiltrados.length) {
    html += `<div class="alerta alerta-info">Nenhum lançamento no período selecionado.</div>`;
  } else {
    const ultimos = lancFiltrados.slice(0, 10);
    html += `<table class="tabela-simples"><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Categoria</th><th>Pagamento</th><th>Valor</th></tr></thead><tbody>`;
    for (const l of ultimos) {
      const sinal = l.tipo === 'Receita' ? '+' : '-';
      const cor = l.tipo === 'Receita' ? 'pos' : 'neg';
      html += `<tr>
        <td>${fmtDataBR(l.data)}</td>
        <td>${l.icone} ${escapeHtml(l.descricao)}</td>
        <td>${badgeTipo(l.tipo)}</td>
        <td>${l.categoria_extra ? escapeHtml(l.categoria_extra) : '—'}</td>
        <td>${badgePagamento(l.forma_pagamento)}</td>
        <td class="lanc-valor ${cor}">${sinal} ${fmtBRL(l.valor)}</td>
      </tr>`;
    }
    html += `</tbody></table>`;
  }

  box.innerHTML = html;

  // ── Renderiza os gráficos após o HTML estar no DOM ──
  if (temEvolucao) {
    const df = lancAnoAtual;
    const mesesMap = {};
    for (const l of df) {
      const d = parseISO(l.data);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!mesesMap[chave]) mesesMap[chave] = { receita: 0, despesa: 0 };
      if (l.tipo === 'Receita') mesesMap[chave].receita += l.valor; else mesesMap[chave].despesa += l.valor;
    }
    const chaves = Object.keys(mesesMap).sort();
    const nomesMeses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    const labels = chaves.map(c => { const [a, m] = c.split('-'); return `${nomesMeses[parseInt(m) - 1]}/${a.slice(2)}`; });
    const recV = chaves.map(c => mesesMap[c].receita);
    const despV = chaves.map(c => mesesMap[c].despesa);
    const saldV = recV.map((r, i) => r - despV[i]);
    graficoEvolucaoMensal('chart-evolucao', labels, recV, despV, saldV);
  }

  if (temPareto) {
    const total = Object.values(classeMap).reduce((a, b) => a + b, 0) || 1;
    let acumulado = 0;
    const cats = catsOrdenadas.map(c => c[0]);
    const vals = catsOrdenadas.map(c => c[1]);
    const acumPct = vals.map(v => { acumulado += (v / total) * 100; return Math.round(acumulado * 100) / 100; });
    graficoPareto('chart-pareto', cats, vals, acumPct);
  }

  if (despesas.length) {
    const selectTop = qs('#db-top-n');
    selectTop.value = String(DB_TOP_N);
    selectTop.addEventListener('change', e => { DB_TOP_N = parseInt(e.target.value); renderTopDespesasChart(despesas); });
    renderTopDespesasChart(despesas);
  }

  if (despesas.length || receitas.length) {
    const totalF = fixos.reduce((s, l) => s + l.valor, 0);
    const totalV = variaveis.reduce((s, l) => s + l.valor, 0);
    if (totalF + totalV > 0) graficoDonut('chart-donut-fv', ['Fixos', 'Variáveis'], [totalF, totalV], ['#00704A', '#f39c12']);
    if (totalR + totalD > 0) graficoDonut('chart-donut-rd', ['Receitas', 'Despesas'], [totalR, totalD], ['#05C47A', '#c0392b']);
  }

  if (despesas.length) {
    const diasNomes = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
    const valsSemana = [0, 0, 0, 0, 0, 0, 0];
    for (const l of despesas) {
      const d = parseISO(l.data);
      const diaJs = d.getDay(); // 0=dom..6=sab
      const idx = (diaJs + 6) % 7; // 0=seg..6=dom
      valsSemana[idx] += l.valor;
    }
    graficoBarraVertical('chart-semana', diasNomes, valsSemana, '#00704A');
  }

  if (lancFiltrados.length) {
    const ordenado = [...lancFiltrados].sort((a, b) => parseISO(a.data) - parseISO(b.data));
    const porDia = {};
    let acumulado = 0;
    for (const l of ordenado) {
      acumulado += l.tipo === 'Receita' ? l.valor : -l.valor;
      porDia[l.data] = acumulado;
    }
    const diasOrdenados = Object.keys(porDia).sort();
    graficoLinhaArea('chart-acumulado', diasOrdenados.map(fmtDataBR), diasOrdenados.map(d => porDia[d]), porDia[diasOrdenados[diasOrdenados.length - 1]] >= 0);
  }

  if (despesasComCatExtra.length) {
    const catExtraMap = {};
    for (const l of despesasComCatExtra) catExtraMap[l.categoria_extra] = (catExtraMap[l.categoria_extra] || 0) + l.valor;
    const ordenado = Object.entries(catExtraMap).sort((a, b) => b[1] - a[1]);
    graficoBarraVertical('chart-cat-extra', ordenado.map(o => o[0]), ordenado.map(o => o[1]), '#00704A');
  }
}

function renderTopDespesasChart(despesas) {
  const descMap = {};
  for (const l of despesas) {
    const chave = `${l.icone} ${l.descricao}`;
    descMap[chave] = (descMap[chave] || 0) + l.valor;
  }
  const ordenado = Object.entries(descMap).sort((a, b) => b[1] - a[1]).slice(0, DB_TOP_N);
  graficoBarraHorizontal('chart-top-despesas', ordenado.map(o => o[0]).reverse(), ordenado.map(o => o[1]).reverse(), 'vermelho');
}
