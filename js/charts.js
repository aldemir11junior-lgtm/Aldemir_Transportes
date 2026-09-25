// ─────────────────────────────────────────────────────────────────────────
// GRÁFICOS (Chart.js) — equivalentes aos gráficos Plotly do app.py
// ─────────────────────────────────────────────────────────────────────────
const CHART_REGISTRY = {};
function destruirGrafico(id) {
  if (CHART_REGISTRY[id]) { CHART_REGISTRY[id].destroy(); delete CHART_REGISTRY[id]; }
}
function corGrid() { return 'rgba(255,255,255,0.08)'; }
function corTexto() { return '#c3d3e6'; }

const COR_RECEITA = '#2ecc71';
const COR_DESPESA = '#e74c3c';
const COR_LUCRO = '#f39c12';
const COR_QTD = '#2d8eca';
const COR_CUSTO_KM = '#8e44ad';

// Gráfico de colunas empilhadas: Receita + Despesa + Lucro por categoria
function graficoRdlEmpilhado(canvasId, categorias, receitas, despesas) {
  destruirGrafico(canvasId);
  const ctx = qs('#' + canvasId).getContext('2d');
  const lucros = receitas.map((r, i) => r - despesas[i]);
  CHART_REGISTRY[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categorias,
      datasets: [
        { label: 'Receita', data: receitas, backgroundColor: COR_RECEITA, stack: 's' },
        { label: 'Despesa', data: despesas, backgroundColor: COR_DESPESA, stack: 's' },
        { label: 'Lucro', data: lucros, backgroundColor: COR_LUCRO, stack: 's' },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: corTexto() } },
        tooltip: { callbacks: { label: c => `${c.dataset.label}: ${fmtBRL(c.parsed.y)}` } },
      },
      scales: {
        x: { stacked: true, ticks: { color: corTexto(), maxRotation: 30 }, grid: { display: false } },
        y: { stacked: true, ticks: { color: corTexto(), callback: v => 'R$ ' + v.toLocaleString('pt-BR') }, grid: { color: corGrid() } },
      },
    },
  });
}

// Gráfico de barras simples de quantidade
function graficoQuantidade(canvasId, categorias, valores) {
  destruirGrafico(canvasId);
  const ctx = qs('#' + canvasId).getContext('2d');
  CHART_REGISTRY[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels: categorias, datasets: [{ label: 'Quantidade', data: valores, backgroundColor: COR_QTD }] },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `Quantidade: ${c.parsed.y}` } } },
      scales: {
        x: { ticks: { color: corTexto(), maxRotation: 30 }, grid: { display: false } },
        y: { ticks: { color: corTexto(), precision: 0 }, grid: { color: corGrid() } },
      },
    },
  });
}

// Gráfico de custo por KM rodado, por caminhão
function graficoCustoKm(canvasId, categorias, valores) {
  destruirGrafico(canvasId);
  const ctx = qs('#' + canvasId).getContext('2d');
  CHART_REGISTRY[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels: categorias, datasets: [{ label: 'R$ / KM', data: valores, backgroundColor: COR_CUSTO_KM }] },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmtBRL(c.parsed.y) + ' / KM' } } },
      scales: {
        x: { ticks: { color: corTexto(), maxRotation: 30 }, grid: { display: false } },
        y: { ticks: { color: corTexto(), callback: v => 'R$ ' + v.toLocaleString('pt-BR') }, grid: { color: corGrid() } },
      },
    },
  });
}
