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

// Gráfico de colunas agrupadas: Receita + Despesa + Lucro por categoria
function graficoRdlColunas(canvasId, categorias, receitas, despesas) {
  destruirGrafico(canvasId);
  const ctx = qs('#' + canvasId).getContext('2d');
  const lucros = receitas.map((r, i) => r - despesas[i]);
  CHART_REGISTRY[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categorias,
      datasets: [
        { label: 'Receita', data: receitas, backgroundColor: COR_RECEITA },
        { label: 'Despesa', data: despesas, backgroundColor: COR_DESPESA },
        { label: 'Lucro', data: lucros, backgroundColor: COR_LUCRO },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: corTexto() } },
        tooltip: { callbacks: { label: c => `${c.dataset.label}: ${fmtBRL(c.parsed.y)}` } },
      },
      scales: {
        x: { stacked: false, ticks: { color: corTexto(), maxRotation: 30 }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { color: corTexto(), callback: v => 'R$ ' + v.toLocaleString('pt-BR') }, grid: { color: corGrid() } },
      },
      datasets: {
        bar: { categoryPercentage: 0.9, barPercentage: 1 },
      },
      layout: { padding: { top: 24 } },
    },
    plugins: [{
      id: 'rotulosValoresRdl',
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        ctx.save();
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = corTexto();
        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          if (!chart.isDatasetVisible(datasetIndex)) return;
          meta.data.forEach((bar, index) => {
            const valor = dataset.data[index];
            if (valor == null) return;
            const { x, y, base } = bar.getProps(['x', 'y', 'base'], true);
            const positivo = y <= base;
            ctx.textBaseline = positivo ? 'bottom' : 'top';
            ctx.fillText(fmtBRL(valor), x, positivo ? y - 3 : y + 3);
          });
        });
        ctx.restore();
      },
    }],
  });
}

// Plugin de rótulos de valor sobre barras de série única
function pluginRotulosBarras(formatar) {
  return {
    id: 'rotulosValoresBarras',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = corTexto();
      chart.getDatasetMeta(0).data.forEach((bar, index) => {
        const valor = chart.data.datasets[0].data[index];
        if (valor == null) return;
        ctx.fillText(formatar(valor), bar.x, bar.y - 3);
      });
      ctx.restore();
    },
  };
}

// Gráfico de barras simples de quantidade
function graficoQuantidade(canvasId, categorias, valores) {
  destruirGrafico(canvasId);
  const ctx = qs('#' + canvasId).getContext('2d');
  CHART_REGISTRY[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels: categorias, datasets: [{ label: 'Quantidade', data: valores, backgroundColor: COR_RECEITA, borderWidth: 0 }] },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `Quantidade: ${c.parsed.y}` } } },
      scales: {
        x: { ticks: { color: corTexto(), maxRotation: 30 }, grid: { display: false } },
        y: { ticks: { color: corTexto(), precision: 0 }, grid: { color: corGrid() } },
      },
      layout: { padding: { top: 24 } },
    },
    plugins: [pluginRotulosBarras(v => String(v))],
  });
}

// Gráfico de custo por KM rodado, por caminhão
function graficoCustoKm(canvasId, categorias, valores) {
  destruirGrafico(canvasId);
  const ctx = qs('#' + canvasId).getContext('2d');
  CHART_REGISTRY[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels: categorias, datasets: [{ label: 'R$ / KM', data: valores, backgroundColor: COR_RECEITA, borderWidth: 0 }] },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmtBRL(c.parsed.y) + ' / KM' } } },
      scales: {
        x: { ticks: { color: corTexto(), maxRotation: 30 }, grid: { display: false } },
        y: { ticks: { color: corTexto(), callback: v => 'R$ ' + v.toLocaleString('pt-BR') }, grid: { color: corGrid() } },
      },
      layout: { padding: { top: 24 } },
    },
    plugins: [pluginRotulosBarras(fmtBRL)],
  });
}
