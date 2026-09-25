// ─────────────────────────────────────────────────────────────────────────
// GRÁFICOS (Chart.js) — equivalentes aos gráficos Plotly do app original
// ─────────────────────────────────────────────────────────────────────────
const CHART_REGISTRY = {};
function destruirGrafico(id) {
  if (CHART_REGISTRY[id]) { CHART_REGISTRY[id].destroy(); delete CHART_REGISTRY[id]; }
}
function corGrid() {
  return STATE.temaEscuro ? 'rgba(255,255,255,0.06)' : '#eef5f1';
}
function corTexto() {
  return STATE.temaEscuro ? '#a8f0c8' : '#1a6645';
}

function graficoEvolucaoMensal(canvasId, labels, receitas, despesas, saldo) {
  destruirGrafico(canvasId);
  const ctx = qs('#' + canvasId).getContext('2d');
  CHART_REGISTRY[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Receita', data: receitas, borderColor: '#05C47A', backgroundColor: 'rgba(5,196,122,0.12)', fill: true, tension: 0.35, pointRadius: 4 },
        { label: 'Despesa', data: despesas, borderColor: '#c0392b', backgroundColor: 'rgba(192,57,43,0.10)', fill: true, tension: 0.35, pointRadius: 4 },
        { label: 'Saldo', data: saldo, borderColor: '#f1c40f', backgroundColor: 'rgba(241,196,15,0.10)', fill: true, tension: 0.35, pointRadius: 4 },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { color: corTexto() } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${fmtBRL(c.parsed.y)}` } } },
      scales: {
        y: { ticks: { color: corTexto(), callback: v => 'R$ ' + v.toLocaleString('pt-BR') }, grid: { color: corGrid() } },
        x: { ticks: { color: corTexto() }, grid: { display: false } },
      },
    },
  });
}

function graficoPareto(canvasId, categorias, valores, acumuladoPct) {
  destruirGrafico(canvasId);
  const ctx = qs('#' + canvasId).getContext('2d');
  const n = categorias.length;
  const cores = categorias.map((_, i) => {
    const t = i / Math.max(n - 1, 1);
    const r = Math.round(0 + t * 5), g = Math.round(112 + t * (196 - 112)), b = Math.round(74 + t * (122 - 74));
    return `rgba(${r},${g},${b},0.9)`;
  });
  CHART_REGISTRY[canvasId] = new Chart(ctx, {
    data: {
      labels: categorias,
      datasets: [
        { type: 'bar', label: 'Valor (R$)', data: valores, backgroundColor: cores, yAxisID: 'y' },
        { type: 'line', label: '% Acumulado', data: acumuladoPct, borderColor: '#f1c40f', backgroundColor: '#f1c40f', yAxisID: 'y2', tension: 0.3, pointRadius: 4 },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { color: corTexto() } },
        tooltip: { callbacks: { label: c => c.dataset.yAxisID === 'y2' ? `Acumulado: ${c.parsed.y.toFixed(1)}%` : fmtBRL(c.parsed.y) } } },
      scales: {
        y: { position: 'left', ticks: { color: corTexto(), callback: v => 'R$ ' + v.toLocaleString('pt-BR') }, grid: { color: corGrid() } },
        y2: { position: 'right', min: 0, max: 110, ticks: { color: corTexto(), callback: v => v + '%' }, grid: { display: false } },
        x: { ticks: { color: corTexto() }, grid: { display: false } },
      },
    },
  });
}

function graficoBarraHorizontal(canvasId, labels, valores, corBase) {
  destruirGrafico(canvasId);
  const ctx = qs('#' + canvasId).getContext('2d');
  const n = labels.length;
  const cores = labels.map((_, i) => {
    const t = i / Math.max(n - 1, 1);
    if (corBase === 'vermelho') {
      const r = Math.round(123 + t * (245 - 123)), g = Math.round(0 + t * 183), b = Math.round(0 + t * 177);
      return `rgb(${r},${g},${b})`;
    }
    return '#00704A';
  });
  CHART_REGISTRY[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Valor', data: valores, backgroundColor: cores }] },
    options: {
      indexAxis: 'y', responsive: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmtBRL(c.parsed.x) } } },
      scales: {
        x: { ticks: { color: corTexto(), callback: v => 'R$ ' + v.toLocaleString('pt-BR') }, grid: { color: corGrid() } },
        y: { ticks: { color: corTexto() }, grid: { display: false } },
      },
    },
  });
}

function graficoBarraVertical(canvasId, labels, valores, cor) {
  destruirGrafico(canvasId);
  const ctx = qs('#' + canvasId).getContext('2d');
  CHART_REGISTRY[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Valor', data: valores, backgroundColor: cor || '#00704A' }] },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmtBRL(c.parsed.y) } } },
      scales: {
        y: { ticks: { color: corTexto(), callback: v => 'R$ ' + v.toLocaleString('pt-BR') }, grid: { color: corGrid() } },
        x: { ticks: { color: corTexto() }, grid: { display: false } },
      },
    },
  });
}

function graficoDonut(canvasId, labels, valores, cores) {
  destruirGrafico(canvasId);
  const ctx = qs('#' + canvasId).getContext('2d');
  CHART_REGISTRY[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: valores, backgroundColor: cores }] },
    options: {
      responsive: true, cutout: '65%',
      plugins: { legend: { position: 'bottom', labels: { color: corTexto() } },
        tooltip: { callbacks: { label: c => `${c.label}: ${fmtBRL(c.parsed)}` } } },
    },
  });
}

function graficoLinhaArea(canvasId, labels, valores, positivo) {
  destruirGrafico(canvasId);
  const ctx = qs('#' + canvasId).getContext('2d');
  const cor = positivo ? '#05C47A' : '#c0392b';
  const fill = positivo ? 'rgba(5,196,122,0.12)' : 'rgba(192,57,43,0.10)';
  CHART_REGISTRY[canvasId] = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Saldo acumulado', data: valores, borderColor: cor, backgroundColor: fill, fill: true, tension: 0.25, pointRadius: 0 }] },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmtBRL(c.parsed.y) } } },
      scales: {
        y: { ticks: { color: corTexto(), callback: v => 'R$ ' + v.toLocaleString('pt-BR') }, grid: { color: corGrid() } },
        x: { ticks: { color: corTexto(), maxTicksLimit: 8 }, grid: { display: false } },
      },
    },
  });
}

function graficoProjecao(canvasId, categorias, planejado, real, limite) {
  destruirGrafico(canvasId);
  const ctx = qs('#' + canvasId).getContext('2d');
  const datasets = [
    { type: 'bar', label: 'Planejado', data: planejado, backgroundColor: '#4dc882' },
  ];
  if (real.some(v => v > 0)) datasets.push({ type: 'bar', label: 'Já gasto', data: real, backgroundColor: '#c0392b' });
  if (limite.some(v => v > 0)) datasets.push({ type: 'line', label: 'Limite definido', data: limite, borderColor: '#f1c40f', backgroundColor: '#f1c40f', pointStyle: 'line', showLine: false, pointRadius: 10, borderWidth: 3 });
  CHART_REGISTRY[canvasId] = new Chart(ctx, {
    data: { labels: categorias, datasets },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { color: corTexto() } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${fmtBRL(c.parsed.y)}` } } },
      scales: {
        y: { ticks: { color: corTexto(), callback: v => 'R$ ' + v.toLocaleString('pt-BR') }, grid: { color: corGrid() } },
        x: { ticks: { color: corTexto() }, grid: { display: false } },
      },
    },
  });
}
