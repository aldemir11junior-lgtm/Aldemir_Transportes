// ─────────────────────────────────────────────────────────────────────────
// HELPERS GERAIS
// ─────────────────────────────────────────────────────────────────────────

// ─── FUSO HORÁRIO (Brasil) ─────────────────────────────────────────────
function agoraBr() {
  const agoraUtc = new Date(new Date().toLocaleString('en-US', { timeZone: 'UTC' }));
  return new Date(agoraUtc.getTime() - 3 * 60 * 60 * 1000);
}
function hojeBr() {
  const d = agoraBr();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function dataISO(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function parseISO(s) {
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}
function fmtDataBR(iso) {
  if (!iso) return '-';
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

// ─── HASH DE SENHA (SHA-256, igual ao hashlib.sha256 do Python) ─────────
async function hashPw(pw) {
  const enc = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── FORMATAÇÃO NUMÉRICA (padrão brasileiro, igual ao formatar_numero) ──
function formatarNumero(valor, casas = 2) {
  const n = Number(valor) || 0;
  return n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}
function fmtBRL(valor) {
  return 'R$ ' + formatarNumero(valor, 2);
}

// ─── STATUS DE VIAGEM ────────────────────────────────────────────────────
const STATUS_OPCOES = {
  em_transito: 'Em Trânsito',
  concluida: 'Concluída',
  atrasada: 'Atrasada',
  cancelada: 'Cancelada',
};
function badgeStatus(status) {
  const cls = { em_transito: 'transport', concluida: 'receita', atrasada: 'variavel', cancelada: 'outros' }[status] || 'outros';
  return `<span class="badge badge-${cls}">${escapeHtml(STATUS_OPCOES[status] || status)}</span>`;
}

// ─── UTIL DOM ────────────────────────────────────────────────────────────
function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
function qs(sel, root) { return (root || document).querySelector(sel); }
function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function mostrarMsg(seletor, tipo, texto) {
  const box = qs(seletor);
  if (box) box.innerHTML = texto ? `<div class="alerta alerta-${tipo}">${texto}</div>` : '';
}

// ─── COLUNAS DE EXPORTAÇÃO (mesmas do app.py) ───────────────────────────
const COLUNAS_EXPORT = ['id','data','veiculo','carreta','motorista','origem','destino','volume_tons','faturamento_adiantamento','faturamento_restante','faturamento','pedagio','outros_custos','custo_total','status'];
const CABECALHO_EXPORT = ['ID','Data','Cavalo (Frota)','Carreta','Motorista','Origem','Destino','Volume (T)','Adiantamento (R$)','Restante (R$)','Faturamento Total (R$)','Pedágio (R$)','Outros Custos (R$)','Custo Total (R$)','Status'];

const COLUNAS_EXPORT_COMBUSTIVEL = ['id','data','veiculo','motorista','litros','valor_pago','valor_por_litro','hodometro','km_rodado','cidade'];
const CABECALHO_EXPORT_COMBUSTIVEL = ['ID','Data','Veículo','Motorista','Litros','Valor Pago (R$)','R$/Litro','Hodômetro (KM)','KM Rodado','Cidade'];

// ─── EXPORTAÇÃO CSV / EXCEL (via SheetJS) ───────────────────────────────
function linhaFormatadaExport(l, colunas) {
  return colunas.map(c => {
    if (c === 'data') return fmtDataBR(l[c]);
    if (c === 'status') return STATUS_OPCOES[l[c]] || l[c];
    if (['volume_tons','faturamento_adiantamento','faturamento_restante','faturamento','pedagio','outros_custos','custo_total','litros','valor_pago','hodometro','km_rodado','valor_por_litro'].includes(c)) {
      return (l[c] === null || l[c] === undefined || l[c] === '') ? '' : formatarNumero(l[c], c === 'valor_por_litro' ? 3 : (c === 'hodometro' || c === 'km_rodado' ? 1 : 2));
    }
    return l[c] ?? '';
  });
}
function gerarCsv(linhas, cabecalho, colunas, nomeArquivo) {
  const dados = [cabecalho, ...linhas.map(l => linhaFormatadaExport(l, colunas))];
  const ws = XLSX.utils.aoa_to_sheet(dados);
  const csv = XLSX.utils.sheet_to_csv(ws, { FS: ';' });
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  baixarBlob(blob, nomeArquivo);
}
function gerarXlsx(linhas, cabecalho, colunas, nomeArquivo, tituloAba) {
  const dados = [cabecalho, ...linhas.map(l => linhaFormatadaExport(l, colunas))];
  const ws = XLSX.utils.aoa_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, tituloAba);
  XLSX.writeFile(wb, nomeArquivo);
}
function baixarBlob(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nomeArquivo;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── IMPRESSÃO (equivalente ao PDF do reportlab) ────────────────────────
function imprimirTabela(titulo, linhas, cabecalho, colunas) {
  const linhasHtml = linhas.map(l => `<tr>${linhaFormatadaExport(l, colunas).map(v => `<td>${escapeHtml(v)}</td>`).join('')}</tr>`).join('');
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>${escapeHtml(titulo)}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:20px;color:#111;}
      h1{font-size:18px;margin-bottom:2px;}
      p{font-size:11px;color:#555;margin-top:0;}
      table{width:100%;border-collapse:collapse;font-size:10px;margin-top:14px;}
      th,td{border:1px solid #ccc;padding:5px 7px;text-align:left;}
      th{background:#16213b;color:#fff;}
      tr:nth-child(even){background:#f4f4f4;}
    </style></head><body>
    <h1>${escapeHtml(titulo)}</h1>
    <p>Gerado em ${fmtDataBR(dataISO(hojeBr()))}</p>
    <table><thead><tr>${cabecalho.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>${linhasHtml}</tbody></table>
    <script>window.onload = () => window.print();</script>
    </body></html>
  `);
  win.document.close();
}

// ─── CACHE DE CIDADES DO BRASIL (localStorage, equivalente ao json em disco) ──
const CIDADES_CACHE_KEY = 'transp_cidades_brasil';
async function carregarCidadesBrasil() {
  const salvas = localStorage.getItem(CIDADES_CACHE_KEY);
  if (salvas) {
    try { const lista = JSON.parse(salvas); if (lista.length) return lista; } catch (e) {}
  }
  try {
    const resp = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
    if (!resp.ok) throw new Error('Falha ao buscar cidades');
    const municipios = await resp.json();
    const set = new Set();
    for (const m of municipios) {
      let uf = null;
      try { uf = m.microrregiao.mesorregiao.UF.sigla; }
      catch (e) { try { uf = m['regiao-imediata']['regiao-intermediaria'].UF.sigla; } catch (e2) { continue; } }
      set.add(`${m.nome} - ${uf}`);
    }
    const cidades = Array.from(set).sort();
    if (cidades.length) localStorage.setItem(CIDADES_CACHE_KEY, JSON.stringify(cidades));
    return cidades;
  } catch (e) {
    console.warn('Não foi possível carregar cidades do Brasil:', e);
    return [];
  }
}
