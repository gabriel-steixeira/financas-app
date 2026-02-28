// =============================================
// FINANÇAS APP - Main Application (Firebase)
// =============================================

(function () {
  'use strict';

  // State
  let currentPerson = 'todos';
  let currentMonth = 'fevereiro';
  let currentPage = 'dashboard';
  let cachedData = null;
  let cachedInvestimentos = { personInv: {}, totalInfo: { total: 0, cotacaoDolar: 5.45 } };
  let useFirebase = true;
  let loading = false;
  let autoGenChecked = false;
  let currentPagamentosTab = 'recorrentes'; // 'faturas' ou 'recorrentes'

  // Meses dinâmicos - base fixa + expandível
  let months = ['novembro', 'dezembro', 'janeiro', 'fevereiro'];
  let monthKeys = { novembro: '2025-11', dezembro: '2025-12', janeiro: '2026-01', fevereiro: '2026-02' };
  let monthLabels = { novembro: 'Nov', dezembro: 'Dez', janeiro: 'Jan', fevereiro: 'Fev' };
  let monthFull = { novembro: 'Novembro 2025', dezembro: 'Dezembro 2025', janeiro: 'Janeiro 2026', fevereiro: 'Fevereiro 2026' };

  const MONTH_NAMES = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const MONTH_ABBR = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  function addMonthToSystem(mesKey) {
    const [ano, mes] = mesKey.split('-');
    const mesNum = parseInt(mes);
    const slug = MONTH_NAMES[mesNum].toLowerCase();
    if (months.includes(slug) && monthKeys[slug] === mesKey) return;
    // Se o slug já existe (ex: janeiro de outro ano), usar slug+ano
    const finalSlug = months.includes(slug) ? `${slug}${ano}` : slug;
    if (months.includes(finalSlug)) return;
    months.push(finalSlug);
    monthKeys[finalSlug] = mesKey;
    monthLabels[finalSlug] = MONTH_ABBR[mesNum];
    monthFull[finalSlug] = `${MONTH_NAMES[mesNum]} ${ano}`;
  }

  const app = document.getElementById('app');

  // ====== DATA LAYER ======
  async function loadData() {
    const mesKey = monthKeys[currentMonth];
    if (useFirebase && typeof DB !== 'undefined') {
      try {
        cachedData = await DB.getDadosMes(currentPerson, mesKey);
        return;
      } catch (e) {
        console.warn('⚠️ Firebase falhou, usando dados locais:', e);
      }
    }
    // Fallback to local data.js
    const local = FINANCAS_DATA?.[currentPerson]?.[currentMonth];
    if (local) {
      const totalReceitas = local.receitas.reduce((s, r) => s + r.valor, 0);
      const totalGastos = local.gastos.reduce((s, g) => s + g.valor, 0);
      cachedData = {
        receitas: local.receitas,
        gastos: local.gastos,
        faturas: local.faturas || {},
        totalReceitas,
        totalGastos,
        saldo: totalReceitas - totalGastos
      };
    } else {
      cachedData = { receitas: [], gastos: [], faturas: {}, totalReceitas: 0, totalGastos: 0, saldo: 0 };
    }
  }

  async function loadInvestimentos() {
    if (useFirebase && typeof DB !== 'undefined') {
      try {
        const mesKey = monthKeys[currentMonth];
        const personInv = await DB.getInvestimentos(currentPerson, mesKey);
        // personInv agora é um objeto { id: { ... } }

        const { total, cotacaoDolar } = await DB.getTotalInvestimentos(mesKey);

        // Se getTotalInvestimentos retorna total misturado, precisamos ajustar para mostrar na tela o total correto
        // na verdade o getTotalInvestimentos já calcula convertendo USD.
        // O renderInvestimentos vai precisar saber a cotação para exibir e converter itens individuais.

        cachedInvestimentos = {
          personInv,
          totalInfo: { total, cotacaoDolar }
        };
        return;
      } catch (e) {
        console.warn('⚠️ Firebase investimentos falhou:', e);
      }
    }
    // Fallback (apenas para não quebrar se falhar, mas o foco é Firebase)
    cachedInvestimentos = { personInv: {}, totalInfo: { total: 0, cotacaoDolar: 5.45 } };
  }

  async function loadChartData() {
    const chartData = [];
    for (const m of months) {
      const mesKey = monthKeys[m];
      if (useFirebase && typeof DB !== 'undefined') {
        try {
          const d = await DB.getDadosMes(currentPerson, mesKey);
          chartData.push({ income: d.totalReceitas, expense: d.totalGastos });
          continue;
        } catch (e) { /* fallback */ }
      }
      const local = FINANCAS_DATA?.[currentPerson]?.[m];
      if (local) {
        chartData.push({ income: getTotalReceitas(local), expense: getTotalGastos(local) });
      } else {
        chartData.push({ income: 0, expense: 0 });
      }
    }
    return chartData;
  }

  // ====== INIT ======
  async function init() {
    bindEvents();

    // Auto-gerar próximo mês se necessário
    if (!autoGenChecked && useFirebase && typeof DB !== 'undefined') {
      autoGenChecked = true;
      try {
        // Detectar mês atual real
        const now = new Date();
        const mesAtualReal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Verificar se o próximo mês já existe, senão criar
        const proximoMesKey = await DB.verificarEAutoGerarMes(mesAtualReal);
        if (proximoMesKey) {
          addMonthToSystem(proximoMesKey);
        }

        // Selecionar o mês atual real como padrão
        const slugAtual = Object.entries(monthKeys).find(([, v]) => v === mesAtualReal);
        if (slugAtual) currentMonth = slugAtual[0];
      } catch (e) {
        console.warn('⚠️ Erro na auto-geração de mês:', e);
      }
    }

    await render();
  }

  // ====== RENDER ======
  async function render() {
    if (loading) return;
    loading = true;

    // Show loading state briefly
    const existingNav = document.querySelector('.bottom-nav');
    if (!existingNav) {
      app.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; gap: 16px;">
          <div style="font-size: 3rem;">💰</div>
          <div class="spinner"></div>
          <p style="color: var(--text-secondary); font-size: 0.85rem;">Carregando dados...</p>
        </div>
      `;
    }

    await loadData();
    const isConfig = currentPage === 'config';
    const isInvest = currentPage === 'investimentos';
    await loadInvestimentos();
    await processarBeneficiosPendentes();

    const sections = [renderHeader()];
    if (!isConfig) sections.push(renderMonthSelector());
    sections.push(currentPage === 'dashboard' ? await renderDashboard() : renderDashboardHidden());
    sections.push(renderReceitas());
    sections.push(renderGastos());
    sections.push(renderPagamentos());
    sections.push(isInvest ? renderInvestimentos() : renderInvestimentosHidden());
    sections.push(renderConfig());
    sections.push(renderBottomNav());

    // Modal container
    sections.push('<div id="modal-overlay" class="modal-overlay" style="display:none" onclick="closeModal()"></div>');
    sections.push('<div id="modal" class="modal" style="display:none"></div>');

    app.innerHTML = sections.join('');
    loading = false;
  }

  function renderDashboardHidden() {
    return `<div class="page ${currentPage === 'dashboard' ? 'active' : ''}" id="page-dashboard"></div>`;
  }

  function renderInvestimentosHidden() {
    return `<div class="page ${currentPage === 'investimentos' ? 'active' : ''}" id="page-investimentos"></div>`;
  }

  // ====== HEADER ======
  function renderHeader() {
    // Ícone baseando na seleção
    let icon = '👥'; // todos
    let label = 'Todos';
    let activeClass = '';

    if (currentPerson === 'gabriel') { icon = '👦🏻'; label = 'Gabriel'; activeClass = 'person-gabriel'; }
    else if (currentPerson === 'clara') { icon = '👩🏻'; label = 'Clara'; activeClass = 'person-clara'; }

    return `
    <div class="header">
      <div class="header-top">
        <div>
          <h1><span class="logo-emoji">💰</span> Finanças</h1>
          <div class="header-subtitle">${monthFull[currentMonth]}</div>
        </div>
        
        <div class="person-filter-container">
          <button class="person-filter-btn ${activeClass}" id="personFilterBtn">
            <span class="p-icon">${icon}</span>
            <span class="p-label">${label}</span>
            <span class="p-arrow">▼</span>
          </button>
          
          <div class="person-dropdown" id="personDropdown">
            <div class="p-item" data-person="todos">
              <span class="p-icon">👥</span> Todos
            </div>
            <div class="p-item" data-person="gabriel">
              <span class="p-icon">👦🏻</span> Gabriel
            </div>
            <div class="p-item" data-person="clara">
              <span class="p-icon">👩🏻</span> Clara
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
  }

  // ====== MONTH SELECTOR ======
  function renderMonthSelector() {
    return `
      <div class="month-selector">
        ${months.map(m => {
      const anoSuffix = monthKeys[m] ? monthKeys[m].split('-')[0].slice(2) : '26';
      return `
          <button class="month-btn ${currentMonth === m ? 'active' : ''}" data-month="${m}">
            ${monthLabels[m]} ${anoSuffix}
          </button>`;
    }).join('')}
      </div>
    `;
  }

  // ====== DASHBOARD ======
  async function renderDashboard() {
    if (currentPage !== 'dashboard') return renderDashboardHidden();
    const d = cachedData;

    const chartData = await loadChartData();
    const maxChart = Math.max(...chartData.flatMap(c => [c.income, c.expense]), 1);

    const allTransactions = [
      ...d.receitas.map(r => ({ ...r, type: 'receita' })),
      ...d.gastos.map(g => ({ ...g, type: 'gasto' })),
    ].slice(0, 6);

    return `
      <div class="page active" id="page-dashboard">
        <div class="balance-card">
          <div class="label">Saldo do Mês</div>
          <div class="amount ${d.saldo >= 0 ? 'positive' : 'negative'}">${formatCurrency(d.saldo)}</div>
          <div class="detail">
            <span><span class="dot green"></span> Receitas: ${formatCurrency(d.totalReceitas)}</span>
            <span><span class="dot red"></span> Gastos: ${formatCurrency(d.totalGastos)}</span>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card" onclick="navigateTo('receitas')">
            <div class="icon green">📥</div>
            <div class="label">Receitas</div>
            <div class="value positive">${formatCurrency(d.totalReceitas)}</div>
          </div>
          <div class="summary-card" onclick="navigateTo('gastos')">
            <div class="icon red">📤</div>
            <div class="label">Gastos</div>
            <div class="value negative">${formatCurrency(d.totalGastos)}</div>
          </div>
          <div class="summary-card" onclick="navigateTo('pagamentos')">
            <div class="icon orange">💳</div>
            <div class="label">Pagamentos</div>
            <div class="value">${Object.keys(d.faturas || {}).length} faturas</div>
          </div>
          <div class="summary-card" onclick="navigateTo('investimentos')">
            <div class="icon purple">💎</div>
            <div class="label">Investimentos</div>
            <div class="value positive">Ver</div>
          </div>
        </div>

        <div class="chart-container">
          <h3>📊 Receitas vs Gastos</h3>
          <div class="bar-chart">
            ${chartData.map((c, i) => `
              <div class="bar-group">
                <div class="bar-pair">
                  <div class="bar income" style="height: ${(c.income / maxChart) * 100}%"></div>
                  <div class="bar expense" style="height: ${(c.expense / maxChart) * 100}%"></div>
                </div>
                <div class="bar-label">${monthLabels[months[i]]}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="section-title">
          Últimas Transações
          <span class="count">${allTransactions.length}</span>
        </div>
        <div class="transaction-list">
          ${allTransactions.map((t, i) => renderTransactionItem(t, i)).join('')}
        </div>
      </div>
    `;
  }

  // ====== RECEITAS ======
  function renderReceitas() {
    const d = cachedData;
    if (currentPage !== 'receitas') return `<div class="page" id="page-receitas"></div>`;

    return `
      <div class="page active" id="page-receitas">
        <div class="balance-card" style="background: linear-gradient(135deg, #0a2e1a 0%, #0f3d1e 50%, #164d26 100%);">
          <div class="label">Total de Receitas</div>
          <div class="amount positive">${formatCurrency(d.totalReceitas)}</div>
          <div class="detail">
            <span>${d.receitas.length} entradas neste mês</span>
          </div>
        </div>

        <div class="section-title">
          Todas as Receitas
          <span class="count">${d.receitas.length}</span>
          ${currentPerson !== 'todos' ? `<button class="add-btn" onclick="openAddModal('receita')">➕</button>` : ''}
        </div>
        <div class="transaction-list">
          ${d.receitas.map((r, i) => renderTransactionItem({ ...r, type: 'receita' }, i, true)).join('')}
        </div>
      </div>
    `;
  }

  // ====== GASTOS ======
  function renderGastos() {
    const d = cachedData;
    if (currentPage !== 'gastos') return `<div class="page" id="page-gastos"></div>`;

    const total = d.totalGastos;
    const byCategory = {};
    d.gastos.forEach(g => {
      if (!byCategory[g.categoria]) byCategory[g.categoria] = { total: 0, count: 0 };
      byCategory[g.categoria].total += g.valor;
      byCategory[g.categoria].count++;
    });

    const categoryColors = {
      'Investimento': 'var(--purple)', 'Boleto': 'var(--orange)',
      'Fatura cartão': 'var(--red)', 'Presente': 'var(--blue)',
      'Transporte': 'var(--yellow)', 'Alimentação': 'var(--teal)',
      'Coleta': 'var(--teal)',
    };

    return `
      <div class="page active" id="page-gastos">
        <div class="balance-card" style="background: linear-gradient(135deg, #2e0a0a 0%, #3d0f0f 50%, #4d1616 100%);">
          <div class="label">Total de Gastos</div>
          <div class="amount negative">${formatCurrency(total)}</div>
          <div class="detail">
            <span>${d.gastos.length} saídas neste mês</span>
          </div>
        </div>

        <div class="chart-container">
          <h3>📊 Por Categoria</h3>
          <div class="donut-container">
            <svg class="donut" viewBox="0 0 42 42">
              ${total > 0 ? renderDonut(byCategory, categoryColors, total) : ''}
            </svg>
            <div class="donut-legend">
              ${Object.entries(byCategory).map(([cat, info]) => `
                <div class="legend-item">
                  <span class="legend-dot" style="background: ${categoryColors[cat] || 'var(--text-tertiary)'}"></span>
                  <span class="legend-label">${cat}</span>
                  <span class="legend-value">${total > 0 ? Math.round(info.total / total * 100) : 0}%</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="section-title">
          Todos os Gastos
          <span class="count">${d.gastos.length}</span>
          ${currentPerson !== 'todos' ? `<button class="add-btn" onclick="openAddModal('despesa')">➕</button>` : ''}
        </div>
        <div class="transaction-list">
          ${d.gastos.map((g, i) => renderTransactionItem({ ...g, type: 'gasto' }, i, true)).join('')}
        </div>
      </div>
    `;
  }

  function renderDonut(byCategory, colors, total) {
    const entries = Object.entries(byCategory);
    let offset = 0;
    const circumference = 2 * Math.PI * 15.91549431;

    return entries.map(([cat, info]) => {
      const pct = info.total / total;
      const dash = pct * circumference;
      const gap = circumference - dash;
      const currentOffset = offset;
      offset += pct * 100;
      const color = colors[cat] || '#636366';

      return `<circle cx="21" cy="21" r="15.91549431" fill="transparent"
        stroke="${color}" stroke-width="5"
        stroke-dasharray="${dash} ${gap}"
        stroke-dashoffset="${-currentOffset * circumference / 100}"
        transform="rotate(-90 21 21)" />`;
    }).join('');
  }

  // ====== PAGAMENTOS (UNIFICADO) ======
  function renderPagamentos() {
    if (currentPage !== 'pagamentos') return `<div class="page" id="page-pagamentos"></div>`;

    return `
      <div class="page active" id="page-pagamentos">
        <div class="sub-tab-selector">
          <button class="sub-tab ${currentPagamentosTab === 'faturas' ? 'active' : ''}" onclick="switchPagamentosTab('faturas')">💳 Faturas</button>
          <button class="sub-tab ${currentPagamentosTab === 'recorrentes' ? 'active' : ''}" onclick="switchPagamentosTab('recorrentes')">🔁 Recorrentes</button>
        </div>

        ${currentPagamentosTab === 'faturas' ? renderPagamentosFaturas() : renderPagamentosRecorrentes()}
      </div>
    `;
  }

  window.switchPagamentosTab = function (tab) {
    currentPagamentosTab = tab;
    render();
  };

  function renderPagamentosFaturas() {
    const faturas = cachedData.faturas || {};
    const keys = Object.keys(faturas);
    const isIndividual = currentPerson !== 'todos';

    return `
      <div class="balance-card" style="background: linear-gradient(135deg, #1a0a2e 0%, #2e0f3d 50%, #3d164d 100%); margin-top: 10px;">
        <div class="label">Total de Faturas</div>
        <div class="amount negative">${formatCurrency(keys.reduce((s, k) => s + (faturas[k].total || 0), 0))}</div>
        <div class="detail">
          <span>${keys.length} cartões</span>
        </div>
      </div>

      <div class="section-title">
        Faturas do Mês
        <span class="count">${keys.length}</span>
        ${isIndividual ? `<button class="add-btn" onclick="openAddFaturaModal()">➕</button>` : ''}
      </div>

      ${keys.length === 0 ? `
        <div class="empty-state">
          <div class="emoji">💳</div>
          <p>Nenhuma fatura para este mês.</p>
        </div>
      ` : keys.map((key, i) => {
      const f = faturas[key];
      const itens = Array.isArray(f.itens) ? f.itens : Object.values(f.itens || {});
      return `
            <div class="fatura-card" data-fatura="${key}" style="animation-delay: ${i * 80}ms">
              <div class="fatura-header" onclick="toggleFatura('${key}')">
                <div class="left">
                  <div class="card-icon">💳</div>
                  <div>
                    <div class="card-name">${f.nome || key}${f.vencimento ? ' <small style="opacity:0.6">venc. dia ' + f.vencimento + '</small>' : ''}${currentPerson === 'todos' && f.pessoa ? ' <small style="opacity:0.5">(' + f.pessoa + ')</small>' : ''}</div>
                    <div class="card-total">${itens.length} itens</div>
                  </div>
                </div>
                <div style="text-align: right; display: flex; align-items: center; gap: 10px;">
                  <div class="total-value ${f.pago ? 'paid' : ''}" style="${f.pago ? 'color: var(--green); text-decoration: line-through; opacity: 0.6;' : ''}">${formatCurrency(f.total || 0)}</div>
                  ${isIndividual ? `
                    ${f.vencimento ? `
                      <button class="btn-action-inv" onclick="event.stopPropagation(); setFaturaPaga('${key}', ${!f.pago})" title="${f.pago ? 'Desmarcar pagamento' : 'Marcar como paga'}">
                        ${f.pago ? '✅' : '⚪'}
                      </button>
                    ` : `
                      <button class="btn-action-inv" title="Adicione um vencimento na edição da fatura para pagar" style="opacity: 0.3; cursor: not-allowed;" onclick="event.stopPropagation(); alert('Edite a fatura e defina o dia de vencimento para ativar opções de pagamento.')">
                        ⚪
                      </button>
                    `}
                    <button class="btn-action-inv" onclick="event.stopPropagation(); openEditFaturaModal('${key}')" title="Configurar benefícios">⚙️</button>
                  ` : ''}
                  <span class="chevron">▼</span>
                </div>
              </div>
              <div class="fatura-items">
                ${itens.map(item => `
                  <div class="fatura-item"${isIndividual && item.id ? ' onclick="openEditFaturaItemModal(\'' + key + '\', \'' + item.id + '\')" style="cursor:pointer;"' : ''}>
                    <div class="item-info">
                      <div class="item-name">${item.nome}</div>
                      <div class="item-parcela">${item.parcela || ''}${item.data ? ' • ' + item.data : ''}</div>
                    </div>
                    <div class="item-value">${formatCurrency(item.valor)}</div>
                  </div>
                `).join('')}
                ${isIndividual ? `<div class="fatura-item" style="justify-content:center; opacity:0.6; cursor:pointer;" onclick="openAddFaturaItemModal('${key}')">➕ Adicionar item</div>` : ''}
              </div>
            </div>
          `;
    }).join('')}
    `;
  }

  function renderPagamentosRecorrentes() {
    const allTrans = [...(cachedData.receitas || []), ...(cachedData.gastos || [])];
    const recs = allTrans.filter(t => !!t.parcela);

    const totalMesRec = recs.reduce((s, r) => s + Math.abs(r.valor), 0);
    const byCompromisso = {};
    recs.forEach(r => {
      const key = r.descricao || r.categoria;
      if (!byCompromisso[key]) byCompromisso[key] = 0;
      byCompromisso[key] += Math.abs(r.valor);
    });

    return `
      <div class="chart-container" style="margin-top: 10px;">
        <h3>📊 Pesos dos Recorrentes (Este Mês)</h3>
        <div class="donut-container">
          <svg class="donut" viewBox="0 0 42 42">
            ${totalMesRec > 0 ? renderDonutRec(byCompromisso, totalMesRec) : ''}
          </svg>
          <div class="donut-legend">
            ${Object.entries(byCompromisso)
        .sort((a, b) => b[1] - a[1])
        .map(([nome, valor], i) => {
          const colors = ['#30d158', '#0a84ff', '#bf5af2', '#ff9f0a', '#ff453a', '#64d2ff', '#ff375f'];
          const color = colors[i % colors.length];
          return `
                  <div class="legend-item" style="margin-bottom: 4px;">
                    <span class="legend-dot" style="background: ${color}"></span>
                    <span class="legend-label" style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${nome}</span>
                    <span class="legend-value">${Math.round(valor / totalMesRec * 100)}%</span>
                  </div>
                `;
        }).join('')}
          </div>
        </div>
      </div>

      <div class="section-title">
        Compromissos Ativos
        <span class="count">${recs.length}</span>
      </div>

      <div class="transaction-list">
        ${recs.map((r, i) => `
          <div class="transaction-item" style="animation-delay: ${i * 40}ms" data-recid="${r.recorrenteId || (r.pessoa + '_' + r.descricao + '_' + r.categoria)}" onclick="openRecorrenteDetail(this.dataset.recid)">
            <div class="cat-icon" style="background: var(--bg-card-hover)">🔁</div>
            <div class="info">
              <div class="name">${r.descricao}${currentPerson === 'todos' && r.pessoa ? ' <small style="opacity:0.5">(' + r.pessoa + ')</small>' : ''}</div>
              <div class="desc">
                <span class="cat-badge">${r.parcela}</span>
                ${r.dataFinal ? `<small style="margin-left:5px; opacity:0.6">até ${r.dataFinal}</small>` : ''}
              </div>
            </div>
            <div class="amount negative">
              ${formatCurrency(r.valor)}
              <span class="date">Clique para detalhes</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderDonutRec(byCompromisso, total) {
    const entries = Object.entries(byCompromisso).sort((a, b) => b[1] - a[1]);
    let offset = 0;
    const circumference = 2 * Math.PI * 15.91549431;
    const colors = ['#30d158', '#0a84ff', '#bf5af2', '#ff9f0a', '#ff453a', '#64d2ff', '#ff375f'];

    return entries.map(([nome, valor], i) => {
      const pct = valor / total;
      const dash = pct * circumference;
      const gap = circumference - dash;
      const currentOffset = offset;
      offset += pct * 100;
      const color = colors[i % colors.length];

      return `<circle cx="21" cy="21" r="15.91549431" fill="transparent"
        stroke="${color}" stroke-width="5"
        stroke-dasharray="${dash} ${gap}"
        stroke-dashoffset="${-currentOffset * circumference / 100}"
        transform="rotate(-90 21 21)" />`;
    }).join('');
  }

  // ====== INVESTIMENTOS ======
  function renderInvestimentos() {
    if (currentPage !== 'investimentos') return renderInvestimentosHidden();
    const inv = cachedInvestimentos;
    if (!inv) return renderInvestimentosHidden();

    const cotacao = inv.totalInfo.cotacaoDolar || 5.45;
    const entries = Object.values(inv.personInv); // Agora é um objeto { id: { ... } } ou array do fallback

    // Calcular total somando BRL + USD convertido
    const totalReal = entries.reduce((sum, v) => {
      let val = v.valor || 0;
      if (v.moeda === 'USD') val *= cotacao;
      return sum + val;
    }, 0);

    const isIndividual = currentPerson !== 'todos';

    return `
    <div class="page active" id="page-investimentos">
      <div class="balance-card" style="background: linear-gradient(135deg, #0a1a2e 0%, #0f2a4d 50%, #143d6b 100%);">
        <div class="label">Total Investimentos (${currentPerson === 'todos' ? 'Consolidado' : (currentPerson === 'gabriel' ? 'Gabriel' : 'Clara')})</div>
        <div class="amount positive">${formatCurrency(totalReal)}</div>
        <div class="detail" style="flex-direction: column; align-items: start;">
          <span>Cotação Dólar (fim do mês):</span>
          <div class="cotacao-input-container">
            <span>R$</span>
            <input type="number" class="cotacao-input" value="${cotacao}" step="0.01" onchange="saveCotacao(this.value)">
          </div>
        </div>
      </div>

      <div class="section-title">
        ${currentPerson === 'todos' ? 'Todos' : (currentPerson === 'gabriel' ? 'Gabriel' : 'Clara')} - Carteira
        <span class="count">${entries.length} ativos</span>
      </div>

      ${entries.map((data, i) => {
      const isUsd = data.moeda === 'USD';
      const valorBrl = isUsd ? (data.valor * cotacao) : data.valor;

      return `
          <div class="invest-card" style="animation-delay: ${i * 50}ms">
            <div>
              <div class="invest-name">${data.nome} ${currentPerson === 'todos' ? `<small style="opacity:0.6">(${data.pessoa})</small>` : ''}</div>
              <div class="invest-value">
                ${isUsd ? `US$ ${data.valor.toFixed(2)} <small style="display:block; font-size:0.8em; opacity:0.7">≈ ${formatCurrency(valorBrl)}</small>` : formatCurrency(data.valor)}
              </div>
            </div>
            ${isIndividual ? `
            <div class="invest-actions">
              <button class="btn-action-inv btn-edit-inv" data-id="${data.id}">✎</button>
              <button class="btn-action-inv btn-del-inv" data-id="${data.id}">✕</button>
            </div>
            ` : ''}
          </div>
        `;
    }).join('')}
      
      ${isIndividual ? `
      <button class="fab-add" onclick="openAddInvestimentoModal()">+</button>
      ` : ''}

      <div style="height: 100px;"></div>
    </div>
  `;
  }

  // ====== TRANSACTION ITEM ======
  function renderTransactionItem(t, i, showActions = false) {
    const isReceita = t.type === 'receita';
    const icon = getCategoryIcon(t.categoria);
    const catClass = getCategoryClass(t.categoria);
    const colorBg = isReceita ? 'var(--green-dim)' : 'var(--red-dim)';
    const canEdit = showActions && t.id && currentPerson !== 'todos';

    return `
      <div class="transaction-item" style="animation-delay: ${i * 40}ms"${canEdit ? ` onclick="openEditModal('${t.id}')"` : ''}>
        <div class="cat-icon" style="background: ${colorBg}">
          ${icon}
        </div>
        <div class="info">
          <div class="name">${t.descricao || t.categoria}${currentPerson === 'todos' && t.pessoa ? ' <small style="opacity:0.5">(' + t.pessoa + ')</small>' : ''}</div>
          <div class="desc">
            <span class="cat-badge ${catClass}">${t.categoria}</span>
            ${t.status ? `<span class="status-badge pago" style="margin-left: 4px">${t.status}</span>` : ''}
          </div>
        </div>
        <div class="amount ${isReceita ? 'positive' : 'negative'}">
          ${isReceita ? '+' : '-'}${formatCurrency(Math.abs(t.valor))}
          ${t.data ? `<span class="date">${t.data}</span>` : ''}
          ${t.detalhesCambio ? `
            <div style="font-size: 0.65rem; opacity: 0.7; margin-top: 4px; color: var(--blue);">
              💵 ${formatCurrency(Math.abs(parseFloat(t.detalhesCambio.valorUsd.replace(',', '.')) || 0), 'USD')} 
              <span style="opacity:0.5">•</span> Câmbio: R$ ${t.detalhesCambio.cambio}
            </div>
          ` : ''}
          ${canEdit ? `<button class="delete-item-btn" onclick="event.stopPropagation(); deleteItem('${t.id}')" title="Excluir">🗑️</button>` : ''}
        </div>
      </div>
    `;
  }

  // ====== CONFIGURAÇÕES ======
  function renderConfig() {
    if (currentPage !== 'config') return `<div class="page" id="page-config"></div>`;

    return `
      <div class="page active" id="page-config">
        <div class="balance-card" style="background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 50%, #3d3d5c 100%);">
          <div class="label">Firebase Realtime Database</div>
          <div class="amount" style="font-size: 1.4rem; color: var(--text-primary);">🔥 Conectado</div>
          <div class="detail">
            <span>financas-app-3ccc1 • Realtime Database</span>
          </div>
        </div>

        <div class="section-title">🔗 Conexão</div>

        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px;">
          <button class="config-btn test" onclick="testFirebaseConnection()">🔌 Testar Conexão Firebase</button>
        </div>

        <div id="config-message" style="display: none;"></div>

        <div class="section-title">📊 Informações</div>
        <div class="chart-container">
          <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.8;">
            <p>🔥 <strong>Projeto:</strong> financas-app-3ccc1</p>
            <p>🗄️ <strong>Database:</strong> Realtime Database</p>
            <p>📊 <strong>Dados:</strong> Transações, Faturas, Investimentos</p>
            <p style="margin-top: 12px; color: var(--text-tertiary); font-size: 0.7rem;">
              Dados armazenados no Firebase com CRUD completo. Use os botões ➕ nas telas de receitas e gastos para adicionar itens.
            </p>
          </div>
        </div>

        <div class="section-title" style="margin-top: 8px;">📅 Gerenciar Meses</div>
        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px;">
          <div class="chart-container">
            <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.8;">
              <p>O app gera automaticamente o próximo mês ao iniciar.</p>
              <p>Se os dados gerados estiverem incorretos, use o botão abaixo para <strong>apagar e re-gerar</strong> o próximo mês.</p>
            </div>
          </div>
          <button class="config-btn test" onclick="reGenerateNextMonth()" style="background: var(--orange); color: #fff;">
            🔄 Re-gerar Próximo Mês (${MONTH_NAMES[new Date().getMonth() + 2] || MONTH_NAMES[1]})
          </button>

          <button class="config-btn" onclick="limparDadosOrfaos()" style="background: var(--red-dim); color: var(--red); border: 1px solid var(--red-dim);">
            <span>🗑️</span> Limpeza Radical de Órfãos
          </button>
          <div id="config-message" style="display: none;"></div>

          <div style="margin-top: 24px; border-top: 1px solid var(--border);">
            <div class="section-title">🔧 Reparos de Dados - Importar Clara</div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <button class="config-btn test" onclick="importarInvestimentosClaraNov()" style="flex: 1; min-width: 120px; background: var(--card-bg); border: 1px solid var(--border); color: var(--text-secondary); font-size: 0.8rem;">
                📥 Nov/25
              </button>
              <button class="config-btn test" onclick="importarInvestimentosClaraDez()" style="flex: 1; min-width: 120px; background: var(--card-bg); border: 1px solid var(--border); color: var(--text-secondary); font-size: 0.8rem;">
                📥 Dez/25
              </button>
              <button class="config-btn test" onclick="importarInvestimentosClaraJan()" style="flex: 1; min-width: 120px; background: var(--card-bg); border: 1px solid var(--border); color: var(--text-secondary); font-size: 0.8rem;">
                📥 Jan/26
              </button>
              <button class="config-btn test" onclick="importarInvestimentosClaraFev()" style="flex: 1; min-width: 120px; background: var(--card-bg); border: 1px solid var(--border); color: var(--text-secondary); font-size: 0.8rem;">
                📥 Fev/26
              </button>
            </div>
          </div>
        </div>

        <div class="section-title" style="margin-top: 8px;">ℹ️ Sobre</div>
        <div class="chart-container">
          <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6;">
            <p>💰 <strong>Finanças App</strong> v3.0 🔥</p>
            <p>Feito com ❤️ para Gabriel & Clara</p>
            <p style="margin-top: 8px;">📱 Adicione à tela inicial do iPhone para usar como app nativo</p>
          </div>
        </div>
      </div>
    `;
  }

  // ====== BOTTOM NAV ======
  function renderBottomNav() {
    const tabs = [
      { id: 'dashboard', icon: '🏠', label: 'Início' },
      { id: 'receitas', icon: '📥', label: 'Receitas' },
      { id: 'gastos', icon: '📤', label: 'Gastos' },
      { id: 'pagamentos', icon: '💳', label: 'Pagamentos' },
      { id: 'investimentos', icon: '💎', label: 'Invest.' },
      { id: 'config', icon: '⚙️', label: 'Config' },
    ];

    return `
      <nav class="bottom-nav">
        ${tabs.map(tab => `
          <button class="nav-item ${currentPage === tab.id ? 'active' : ''}" data-page="${tab.id}">
            <span class="nav-icon">${tab.icon}</span>
            <span class="nav-label">${tab.label}</span>
          </button>
        `).join('')}
      </nav>
    `;
  }

  // ====== UTILS UI ======
  function showConfigMessage(msg, color) {
    const el = document.getElementById('config-message');
    if (el) {
      el.style.display = 'block';
      el.style.padding = '12px';
      el.style.borderRadius = '8px';
      el.style.background = 'var(--card-bg)';
      el.style.color = color || 'var(--text-primary)';
      el.style.fontSize = '0.85rem';
      el.innerHTML = msg;
    }
  }

  // ====== MODAL CRUD ======
  function showModal(html) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal');
    if (overlay && modal) {
      overlay.style.display = 'block';
      modal.style.display = 'block';
      modal.innerHTML = html;
      setTimeout(() => { overlay.classList.add('show'); modal.classList.add('show'); }, 10);
    }
  }

  window.closeModal = function () {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal');
    if (overlay && modal) {
      overlay.classList.remove('show');
      modal.classList.remove('show');
      setTimeout(() => { overlay.style.display = 'none'; modal.style.display = 'none'; }, 300);
    }
  };

  window.openAddModal = function (tipo) {
    const categorias = tipo === 'receita'
      ? ['Salário', 'Pix', 'Extra', 'Benefício', 'Retirada Investimento', 'Sobra do Mês passado']
      : ['Boleto', 'Fatura cartão', 'Investimento', 'Presente', 'Transporte', 'Alimentação', 'Coleta'];

    const personInv = (cachedInvestimentos && cachedInvestimentos.personInv) ? cachedInvestimentos.personInv : {};
    const investOptions = Object.entries(personInv)
      .map(([id, inv]) => `<option value="${id}">${inv.nome} (${inv.moeda === 'USD' ? 'US$' : 'R$'} ${inv.valor})</option>`)
      .join('');

    showModal(`
      <div class="modal-header">
        <h3>${tipo === 'receita' ? '📥 Nova Receita' : '📤 Novo Gasto'}</h3>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <form id="add-form" onsubmit="submitAdd(event, '${tipo}')">
        <div class="form-group">
          <label>Data</label>
          <input type="date" id="f-data" onclick="this.showPicker()" required>
        </div>
        <div class="form-group">
          <label>Categoria</label>
          <select id="f-categoria" required onchange="window.toggleInvestFields(this.value)">
            ${categorias.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>

        <div id="invest-fields" style="display:none; margin-bottom: 15px; padding: 12px; background: rgba(0, 122, 255, 0.05); border: 1px solid rgba(0, 122, 255, 0.2); border-radius: 8px;">
          <div class="form-group">
            <label>Selecionar Investimento</label>
            <select id="f-invest-id" onchange="window.onInvestIdChange(this.value); window.toggleNewInvestFields(this.value)">
              <option value="">-- Selecione --</option>
              ${investOptions}
              <option value="novo" style="font-weight:bold; color:var(--blue);">➕ Novo Investimento...</option>
            </select>
          </div>

          <div id="usd-details-container" style="display:none; margin-top:10px; border-top:1px solid rgba(255,255,255,0.05); padding-top:10px;">
            <div style="font-size:0.75rem; color:var(--blue); font-weight:600; margin-bottom:10px;">💵 Detalhes do Câmbio (USD)</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
              <div class="form-group"><label>Valor USD</label><input type="text" id="f-valor-usd" placeholder="0.00" oninput="window.updateBRLFromUSD()"></div>
              <div class="form-group"><label>Câmbio (BRL/USD)</label><input type="text" id="f-cambio" placeholder="5.45" oninput="window.updateBRLFromUSD()"></div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
              <div class="form-group"><label>IOF (R$)</label><input type="text" id="f-iof" placeholder="0.00" oninput="window.updateBRLFromUSD()"></div>
              <div class="form-group"><label>Taxas/Spread (R$)</label><input type="text" id="f-taxas" placeholder="0.00" oninput="window.updateBRLFromUSD()"></div>
            </div>
          </div>

          <div id="new-invest-fields" style="display:none; margin-top:10px; border-top:1px solid rgba(255,255,255,0.05); padding-top:10px;">
            <div class="form-group">
              <label>Nome do Novo Ativo</label>
              <input type="text" id="f-new-invest-nome" placeholder="Ex: CDB Banco X">
            </div>
            <div class="form-group">
              <label>Moeda</label>
              <select id="f-new-invest-moeda" onchange="window.onInvestIdChange('novo')">
                <option value="BRL">Real (R$)</option>
                <option value="USD">Dólar (US$)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Descrição</label>
          <input type="text" id="f-descricao" placeholder="Ex: Salário, Conta de luz..." required>
        </div>
        <div class="form-group">
          <label>Valor (R$)</label>
          <input type="number" id="f-valor" step="0.01" min="0" placeholder="0,00" required>
        </div>
        
        <div id="recorrente-container" class="form-group" style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px;">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:600;">
            <input type="checkbox" id="f-recorrente" onchange="document.getElementById('recorrencia-fields').style.display = this.checked ? 'block' : 'none'"> 
            🔁 Recorrente (mensal ou parcelado)
          </label>
          
          <div id="recorrencia-fields" style="display:none; margin-top:10px; border-top: 1px solid rgba(255,255,255,0.05); padding-top:10px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
              <div class="form-group">
                <label>Parcela nº</label>
                <input type="number" id="f-parcela-atual" placeholder="Ex: 8" oninput="window.updateParcelaLogic()">
              </div>
              <div class="form-group">
                <label>Total de Parcelas</label>
                <input type="number" id="f-parcela-total" placeholder="Ex: 46">
              </div>
            </div>
            <div class="form-group">
              <label>Data Final (opcional)</label>
              <input type="text" id="f-dataFinal" placeholder="MM/AAAA" oninput="window.updateParcelaLogic()">
              <small style="opacity:0.5; font-size:0.7rem;">Preencha a data final para calcular o total automaticamente.</small>
            </div>
          </div>
        </div>

        <button type="submit" class="config-btn save" style="width:100%; margin-top: 12px;">
          ✅ Adicionar ${tipo === 'receita' ? 'Receita' : 'Gasto'}
        </button>
      </form>
    `);

    // Iniciar campos se necessário
    window.toggleInvestFields(document.getElementById('f-categoria').value);
  };

  window.toggleInvestFields = function (cat) {
    const elInv = document.getElementById('invest-fields');
    if (elInv) elInv.style.display = (cat === 'Investimento' || cat === 'Retirada Investimento') ? 'block' : 'none';

    const elRec = document.getElementById('recorrente-container');
    if (elRec) {
      const isExcluido = (cat === 'Investimento' || cat === 'Retirada Investimento' || cat === 'Fatura cartão');
      elRec.style.display = isExcluido ? 'none' : 'block';
      // Se esconder, desmarcar o checkbox de recorrência
      if (isExcluido) {
        const checkbox = document.getElementById('f-recorrente');
        if (checkbox) {
          checkbox.checked = false;
          const fields = document.getElementById('recorrencia-fields');
          if (fields) fields.style.display = 'none';
        }
      }
    }
  };

  window.toggleNewInvestFields = function (val) {
    const el = document.getElementById('new-invest-fields');
    if (el) el.style.display = (val === 'novo') ? 'block' : 'none';
  };

  window.onInvestIdChange = function (investId) {
    const usdContainer = document.getElementById('usd-details-container');
    if (!usdContainer) return;

    if (investId === 'novo') {
      const novaMoeda = document.getElementById('f-new-invest-moeda').value;
      usdContainer.style.display = (novaMoeda === 'USD') ? 'block' : 'none';
      return;
    }

    if (!investId) {
      usdContainer.style.display = 'none';
      return;
    }

    const personInv = (cachedInvestimentos && cachedInvestimentos.personInv) ? cachedInvestimentos.personInv : {};
    const inv = personInv[investId];
    if (inv && inv.moeda === 'USD') {
      usdContainer.style.display = 'block';
    } else {
      usdContainer.style.display = 'none';
    }
  };

  window.updateBRLFromUSD = function () {
    const vUsd = parseFloat(document.getElementById('f-valor-usd').value.replace(',', '.')) || 0;
    const camb = parseFloat(document.getElementById('f-cambio').value.replace(',', '.')) || 0;
    const iof = parseFloat(document.getElementById('f-iof').value.replace(',', '.')) || 0;
    const tax = parseFloat(document.getElementById('f-taxas').value.replace(',', '.')) || 0;

    const totalBrl = (vUsd * camb) + iof + tax;
    if (totalBrl > 0) {
      document.getElementById('f-valor').value = totalBrl.toFixed(2);
    }
  };

  window.submitAdd = async function (e, tipo) {
    e.preventDefault();
    const dataInput = document.getElementById('f-data').value;
    const dateParts = dataInput.split('-');
    const dataFormatted = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

    const categoria = document.getElementById('f-categoria').value;
    const valInput = document.getElementById('f-valor').value.replace(',', '.');
    const valor = parseFloat(valInput) || 0;
    const pessoa = currentPerson === 'todos' ? 'gabriel' : currentPerson;
    const mesKey = monthKeys[currentMonth];

    let investId = document.getElementById('f-invest-id')?.value;

    // Lógica de Integração com Investimentos
    if (categoria === 'Investimento' || categoria === 'Retirada Investimento') {
      if (investId === 'novo') {
        const novoNome = document.getElementById('f-new-invest-nome').value;
        const novaMoeda = document.getElementById('f-new-invest-moeda').value;
        if (!novoNome) { alert('Informe o nome do novo investimento.'); return; }

        // Criar novo investimento
        const newKey = await DB.addInvestimento({
          pessoa,
          mes: mesKey,
          nome: novoNome,
          valor: 0, // Inicia com 0, o aporte será somado abaixo
          moeda: novaMoeda
        });
        investId = newKey;
      }

      if (investId) {
        const personInv = (cachedInvestimentos && cachedInvestimentos.personInv) ? cachedInvestimentos.personInv : {};
        const inv = personInv[investId];

        // Se for USD, usamos o valor em dólares para atualizar o saldo do investimento
        const isUSD = inv && inv.moeda === 'USD';
        const vUsdInput = document.getElementById('f-valor-usd')?.value.replace(',', '.');
        const valorParaAjuste = (isUSD && vUsdInput) ? (parseFloat(vUsdInput) || 0) : valor;

        if (categoria === 'Retirada Investimento') {
          if (inv && inv.valor < valorParaAjuste) {
            alert(`Saldo insuficiente no investimento ${inv.nome}. Saldo disponível: ${formatCurrency(inv.valor, inv.moeda)}`);
            return;
          }
          // Decrementar saldo
          await DB.updateInvestimento(investId, { valor: inv.valor - valorParaAjuste });
        } else {
          // Incrementar saldo (Aporte/Investimento)
          const atualVal = inv ? inv.valor : 0;
          await DB.updateInvestimento(investId, { valor: atualVal + valorParaAjuste });
        }
      }
    }

    const isRec = document.getElementById('f-recorrente').checked;
    const pAtu = document.getElementById('f-parcela-atual').value;
    const pTot = document.getElementById('f-parcela-total').value;
    const parcelaStr = isRec ? (pTot ? `${pAtu} de ${pTot}` : (pAtu || 'Mensal')) : null;

    const dados = {
      pessoa,
      mes: mesKey,
      tipo,
      data: dataFormatted,
      categoria,
      descricao: document.getElementById('f-descricao').value,
      valor,
      parcela: parcelaStr,
      dataFinal: isRec ? (document.getElementById('f-dataFinal').value || null) : null,
      recorrenteId: isRec ? (database.ref().push().key) : null,
      dataInicio: isRec ? dataFormatted : null,
      investId: investId || null,
      detalhesCambio: (document.getElementById('usd-details-container').style.display === 'block') ? {
        valorUsd: document.getElementById('f-valor-usd').value,
        cambio: document.getElementById('f-cambio').value,
        iof: document.getElementById('f-iof').value,
        taxas: document.getElementById('f-taxas').value
      } : null
    };

    const key = await DB.addTransacao(dados);
    if (key) {
      closeModal();

      // Garantir que o PRÓXIMO mês exista no seletor de meses por segurança
      let checkMes = dados.mes;
      for (let i = 0; i < 1; i++) {
        checkMes = DB._getProximoMes(checkMes);
        addMonthToSystem(checkMes);
      }

      await render();
    } else {
      alert('Erro ao salvar. Verifique o console.');
    }
  };

  // ====== EDITAR TRANSAÇÃO ======
  window.openEditModal = function (id) {
    const all = [...(cachedData.receitas || []), ...(cachedData.gastos || [])];
    const t = all.find(x => x.id === id);
    if (!t) return;
    const tipo = t.tipo || 'despesa';
    const categorias = tipo === 'receita'
      ? ['Salário', 'Pix', 'Extra', 'Benefício', 'Retirada Investimento', 'Sobra do Mês passado']
      : ['Boleto', 'Fatura cartão', 'Investimento', 'Presente', 'Transporte', 'Alimentação', 'Coleta'];
    let dateVal = '';
    if (t.data) { const p = t.data.split('/'); if (p.length === 3) dateVal = p[2] + '-' + p[1] + '-' + p[0]; }

    const match = (t.parcela || '').match(/(\d+)\s*de\s*(\d+)/i);
    const pAtual = match ? match[1] : (t.parcela || '');
    const pTotal = match ? match[2] : '';
    const isRecorrente = !!t.parcela;

    const personInv = (cachedInvestimentos && cachedInvestimentos.personInv) ? cachedInvestimentos.personInv : {};
    const investOptions = Object.entries(personInv)
      .map(([id, inv]) => `<option value="${id}" ${t.investId === id ? 'selected' : ''}>${inv.nome} (${inv.moeda === 'USD' ? 'US$' : 'R$'} ${inv.valor})</option>`)
      .join('');

    showModal(`
      <div class="modal-header"><h3>✏️ Editar ${tipo === 'receita' ? 'Receita' : 'Gasto'}</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
      <form id="edit-form" onsubmit="submitEdit(event, '${id}', '${tipo}')">
        <div class="form-group"><label>Data</label><input type="date" id="f-data" value="${dateVal}" onclick="this.showPicker()" oninput="window.updateParcelaLogic()"></div>
        <div class="form-group">
          <label>Categoria</label>
          <select id="f-categoria" onchange="window.toggleInvestFields(this.value)">
            ${categorias.map(c => `<option value="${c}" ${c === t.categoria ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>

        <div id="invest-fields" style="display:${(t.categoria === 'Investimento' || t.categoria === 'Retirada Investimento') ? 'block' : 'none'}; margin-bottom: 15px; padding: 12px; background: rgba(0, 122, 255, 0.05); border: 1px solid rgba(0, 122, 255, 0.2); border-radius: 8px;">
          <div class="form-group">
            <label>Selecionar Investimento</label>
            <select id="f-invest-id" onchange="window.onInvestIdChange(this.value)">
              <option value="">-- Selecione --</option>
              ${investOptions}
            </select>
          </div>

          <div id="usd-details-container" style="display:none; margin-top:10px; border-top:1px solid rgba(255,255,255,0.05); padding-top:10px;">
            <div style="font-size:0.75rem; color:var(--blue); font-weight:600; margin-bottom:10px;">💵 Detalhes do Câmbio (USD)</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
              <div class="form-group"><label>Valor USD</label><input type="text" id="f-valor-usd" value="${t.detalhesCambio?.valorUsd || ''}" placeholder="0.00" oninput="window.updateBRLFromUSD()"></div>
              <div class="form-group"><label>Câmbio (BRL/USD)</label><input type="text" id="f-cambio" value="${t.detalhesCambio?.cambio || ''}" placeholder="5.45" oninput="window.updateBRLFromUSD()"></div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
              <div class="form-group"><label>IOF (R$)</label><input type="text" id="f-iof" value="${t.detalhesCambio?.iof || ''}" placeholder="0.00" oninput="window.updateBRLFromUSD()"></div>
              <div class="form-group"><label>Taxas/Spread (R$)</label><input type="text" id="f-taxas" value="${t.detalhesCambio?.taxas || ''}" placeholder="0.00" oninput="window.updateBRLFromUSD()"></div>
            </div>
          </div>
          <small style="opacity:0.6; font-size:0.7rem;">Na edição, para novos ativos, crie-os primeiro na aba investimentos.</small>
        </div>

        <div class="form-group"><label>Descrição</label><input type="text" id="f-descricao" value="${(t.descricao || '').replace(/"/g, '&quot;')}" required></div>
        <div class="form-group"><label>Valor (R$)</label><input type="number" id="f-valor" step="0.01" value="${t.valor}" required></div>

        <div id="recorrente-container" class="form-group" style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px;">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:600;">
            <input type="checkbox" id="f-recorrente" onchange="document.getElementById('recorrencia-fields').style.display = this.checked ? 'block' : 'none'" ${isRecorrente ? 'checked' : ''}> 
            🔁 Recorrente (mensal ou parcelado)
          </label>
          <div id="recorrencia-fields" style="display:${isRecorrente ? 'block' : 'none'}; margin-top:10px; border-top: 1px solid rgba(255,255,255,0.05); padding-top:10px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
              <div class="form-group"><label>Parcela nº</label><input type="number" id="f-parcela-atual" value="${pAtual}" oninput="window.updateParcelaLogic()"></div>
              <div class="form-group"><label>Total de Parcelas</label><input type="number" id="f-parcela-total" value="${pTotal}"></div>
            </div>
            <div class="form-group"><label>Data Final (opcional)</label><input type="text" id="f-dataFinal" placeholder="MM/AAAA" value="${t.dataFinal || ''}" oninput="window.updateParcelaLogic()"></div>
          </div>
        </div>

        <button type="submit" class="config-btn save" style="width:100%; margin-top: 12px;">💾 Salvar Alterações</button>
      </form>
    `);

    // Iniciar campos se necessário
    window.toggleInvestFields(t.categoria);
    window.onInvestIdChange(t.investId);
  };

  window.submitEdit = async function (e, id, tipo) {
    e.preventDefault();
    const all = [...(cachedData.receitas || []), ...(cachedData.gastos || [])];
    const transacaoOriginal = all.find(x => x.id === id);
    if (!transacaoOriginal) return;

    const dataInput = document.getElementById('f-data').value;
    let dataFormatted = '';
    if (dataInput) { const dp = dataInput.split('-'); dataFormatted = dp[2] + '/' + dp[1] + '/' + dp[0]; }

    const categoria = document.getElementById('f-categoria').value;
    const valInput = document.getElementById('f-valor').value.replace(',', '.');
    const valor = parseFloat(valInput) || 0;
    const pessoa = transacaoOriginal.pessoa;
    const investIdNovo = document.getElementById('f-invest-id')?.value || null;
    const investIdAntigo = transacaoOriginal.investId || null;

    // Lógica de Sincronização de Investimento na Edição
    // 1. Reverter impacto anterior se existia
    // 1. Reverter impacto anterior se existia
    if (investIdAntigo) {
      const personInv = (cachedInvestimentos && cachedInvestimentos.personInv) ? cachedInvestimentos.personInv : {};
      const invAntigo = personInv[investIdAntigo];
      if (invAntigo) {
        const fator = transacaoOriginal.categoria === 'Retirada Investimento' ? 1 : -1;

        // Se o investimento antigo era USD, tentamos reverter usando o valor em USD original
        const isUSD = invAntigo.moeda === 'USD';
        const valorReverter = (isUSD && transacaoOriginal.detalhesCambio?.valorUsd)
          ? (parseFloat(transacaoOriginal.detalhesCambio.valorUsd.replace(',', '.')) || 0)
          : transacaoOriginal.valor;

        await DB.updateInvestimento(investIdAntigo, { valor: invAntigo.valor + (valorReverter * fator) });
      }
    }

    // 2. Aplicar novo impacto se categoria for investimento
    if (categoria === 'Investimento' || categoria === 'Retirada Investimento') {
      if (investIdNovo) {
        // Recarregar investimento para pegar valor atualizado após reversão acima
        const invNovoSnap = await database.ref(`investimentos/${investIdNovo}`).once('value');
        const invNovo = invNovoSnap.val();

        if (invNovo) {
          const isUSD = invNovo.moeda === 'USD';
          const vUsdInput = document.getElementById('f-valor-usd')?.value.replace(',', '.');
          const valorParaAjuste = (isUSD && vUsdInput) ? (parseFloat(vUsdInput) || 0) : valor;

          if (categoria === 'Retirada Investimento') {
            if (invNovo.valor < valorParaAjuste) {
              alert(`Saldo insuficiente no investimento ${invNovo.nome}.`);
              return;
            }
            await DB.updateInvestimento(investIdNovo, { valor: invNovo.valor - valorParaAjuste });
          } else {
            await DB.updateInvestimento(investIdNovo, { valor: invNovo.valor + valorParaAjuste });
          }
        }
      }
    }

    const isRecorrenteAgora = document.getElementById('f-recorrente').checked;
    const recId = isRecorrenteAgora ? (transacaoOriginal.recorrenteId || database.ref().push().key) : null;
    const dataIni = isRecorrenteAgora ? (transacaoOriginal.dataInicio || dataFormatted) : null;

    const isRec = document.getElementById('f-recorrente').checked;
    const pAtu = document.getElementById('f-parcela-atual').value;
    const pTot = document.getElementById('f-parcela-total').value;
    const parcelaStr = isRec ? (pTot ? `${pAtu} de ${pTot}` : (pAtu || 'Mensal')) : null;

    const dados = {
      pessoa: transacaoOriginal.pessoa,
      tipo: tipo,
      data: dataFormatted,
      categoria,
      descricao: document.getElementById('f-descricao').value,
      valor,
      parcela: parcelaStr,
      dataFinal: isRec ? (document.getElementById('f-dataFinal').value || null) : null,
      recorrenteId: recId,
      dataInicio: dataIni,
      mes: transacaoOriginal.mes,
      investId: investIdNovo,
      detalhesCambio: (document.getElementById('usd-details-container').style.display === 'block') ? {
        valorUsd: document.getElementById('f-valor-usd').value,
        cambio: document.getElementById('f-cambio').value,
        iof: document.getElementById('f-iof').value,
        taxas: document.getElementById('f-taxas').value
      } : null
    };

    let propagar = false;
    const jaEraRecorrente = !!transacaoOriginal.parcela;
    if (isRecorrenteAgora) {
      if (jaEraRecorrente) {
        propagar = confirm('Deseja aplicar estas alterações (descrição, categoria, valor, data final) também para os meses futuros deste compromisso?');
      } else {
        propagar = true;
      }
    }

    const ok = await DB.updateTransacao(id, dados, propagar);
    if (ok) {
      closeModal();
      if (isRecorrenteAgora) {
        let checkMes = dados.mes;
        for (let i = 0; i < 1; i++) {
          checkMes = DB._getProximoMes(checkMes);
          addMonthToSystem(checkMes);
        }
      }
      await render();
    } else {
      alert('Erro ao atualizar.');
    }
  };

  // ====== CRUD FATURAS UI ======
  window.openAddFaturaModal = function () {
    showModal(
      '<div class="modal-header"><h3>💳 Nova Fatura</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
      '<form onsubmit="submitAddFatura(event)">' +
      '<div class="form-group"><label>Nome do Cartão</label><input type="text" id="fat-cartao" placeholder="Ex: NUBANK, XP..." required></div>' +
      '<div class="form-group"><label>Dia do Vencimento</label><input type="number" id="fat-vencimento" min="1" max="31" placeholder="Ex: 15"></div>' +
      '<button type="submit" class="config-btn save" style="width:100%; margin-top: 12px;">✅ Criar Fatura</button></form>'
    );
  };

  window.submitAddFatura = async function (e) {
    e.preventDefault();
    const key = await DB.addFatura({
      pessoa: currentPerson === 'todos' ? 'gabriel' : currentPerson,
      mes: monthKeys[currentMonth],
      cartao: document.getElementById('fat-cartao').value.toUpperCase(),
      vencimento: document.getElementById('fat-vencimento').value || ''
    });
    if (key) { closeModal(); await render(); }
  };

  window.openEditFaturaModal = function (faturaId) {
    const f = cachedData.faturas[faturaId];
    if (!f) return;

    const b = f.beneficio || { tipo: 'nenhum', valor: '', investId: '' };

    // Lista de investimentos da pessoa proprietária da fatura
    const personInv = (cachedInvestimentos && cachedInvestimentos.personInv) ? cachedInvestimentos.personInv : {};
    const investOptions = Object.entries(personInv)
      .filter(([_, inv]) => inv.pessoa === f.pessoa)
      .map(([id, inv]) => `<option value="${id}" ${b.investId === id ? 'selected' : ''}>${inv.nome}</option>`)
      .join('');

    showModal(`
      <div class="modal-header"><h3>✏️ Editar Fatura</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
      <form onsubmit="submitEditFatura(event, '${faturaId}')">
        <div class="form-group"><label>Nome do Cartão</label><input type="text" id="fat-cartao" value="${f.cartao || f.nome}" required></div>
        <div class="form-group"><label>Dia do Vencimento</label><input type="number" id="fat-vencimento" min="1" max="31" value="${f.vencimento || ''}"></div>
        
        <div style="margin-top: 15px; padding: 12px; background: rgba(168, 85, 247, 0.05); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 8px;">
          <label style="font-weight:600; color:var(--purple); display:block; margin-bottom:8px;">🎁 Benefício Automático (App recompensa)</label>
          <div class="form-group">
            <label>Tipo de Regra</label>
            <select id="fat-ben-tipo" onchange="document.getElementById('ben-valor-group').style.display = this.value === 'nenhum' ? 'none' : 'block'">
              <option value="nenhum" ${b.tipo === 'nenhum' ? 'selected' : ''}>Nenhum</option>
              <option value="cashback" ${b.tipo === 'cashback' ? 'selected' : ''}>% Cashback</option>
              <option value="pontos" ${b.tipo === 'pontos' ? 'selected' : ''}>Pontos (1 : R$)</option>
            </select>
          </div>
          <div id="ben-valor-group" style="display: ${b.tipo === 'nenhum' ? 'none' : 'block'}">
            <div class="form-group">
              <label>Valor da Regra (Ex: 1 ou 5)</label>
              <input type="number" id="fat-ben-valor" step="0.01" value="${b.valor || ''}" placeholder="Ex: 1 para 1% ou 5 para 1pt por R$5">
            </div>
            <div class="form-group">
              <label>Ativo de Destino</label>
              <select id="fat-ben-investId">
                <option value="">-- Selecione o Ativo --</option>
                ${investOptions}
              </select>
            </div>
          </div>
        </div>

        <button type="submit" class="config-btn save" style="width:100%; margin-top: 12px;">💾 Salvar</button>
        <button type="button" class="config-btn test" style="width:100%; margin-top: 8px; background: var(--red-dim); color: var(--red);" onclick="deleteFaturaUI('${faturaId}')">🗑️ Excluir Fatura</button>
      </form>
    `);
  };

  window.submitEditFatura = async function (e, faturaId) {
    e.preventDefault();

    const tipoBen = document.getElementById('fat-ben-tipo').value;
    const beneficio = tipoBen === 'nenhum' ? null : {
      tipo: tipoBen,
      valor: parseFloat(document.getElementById('fat-ben-valor').value.replace(',', '.')) || 0,
      investId: document.getElementById('fat-ben-investId').value,
      processado: cachedData.faturas[faturaId]?.beneficio?.processado || false
    };

    await DB.updateFatura(faturaId, {
      cartao: document.getElementById('fat-cartao').value.toUpperCase(),
      vencimento: document.getElementById('fat-vencimento').value || '',
      beneficio
    });
    closeModal(); await render();
  };

  window.deleteFaturaUI = async function (faturaId) {
    if (!confirm('Excluir esta fatura e todos os itens?')) return;
    await DB.deleteFatura(faturaId);
    closeModal(); await render();
  };

  window.openAddFaturaItemModal = function (faturaId) {
    showModal(
      '<div class="modal-header"><h3>➕ Novo Item</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
      '<form onsubmit="submitAddFaturaItem(event, \'' + faturaId + '\')">' +
      '<div class="form-group"><label>Nome</label><input type="text" id="fi-nome" required></div>' +
      '<div class="form-group"><label>Valor (R$)</label><input type="number" id="fi-valor" step="0.01" required></div>' +
      '<div class="form-group"><label>Data</label><input type="text" id="fi-data" placeholder="DD/MM/AAAA"></div>' +
      '<div class="form-group"><label>Parcela</label><input type="text" id="fi-parcela" placeholder="Ex: 1 de 10"></div>' +
      '<button type="submit" class="config-btn save" style="width:100%; margin-top: 12px;">✅ Adicionar</button></form>'
    );
  };

  window.submitAddFaturaItem = async function (e, faturaId) {
    e.preventDefault();
    await DB.addFaturaItem(faturaId, {
      nome: document.getElementById('fi-nome').value,
      valor: parseFloat(document.getElementById('fi-valor').value),
      data: document.getElementById('fi-data').value || '',
      parcela: document.getElementById('fi-parcela').value || ''
    });
    closeModal(); await render();
  };

  window.openEditFaturaItemModal = function (faturaId, itemId) {
    const f = cachedData.faturas[faturaId]; if (!f) return;
    const item = f.itens.find(function (i) { return i.id === itemId; }); if (!item) return;
    showModal(
      '<div class="modal-header"><h3>✏️ Editar Item</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
      '<form onsubmit="submitEditFaturaItem(event, \'' + faturaId + '\', \'' + itemId + '\')">' +
      '<div class="form-group"><label>Nome</label><input type="text" id="fi-nome" value="' + item.nome.replace(/"/g, '&quot;') + '" required></div>' +
      '<div class="form-group"><label>Valor (R$)</label><input type="number" id="fi-valor" step="0.01" value="' + item.valor + '" required></div>' +
      '<div class="form-group"><label>Data</label><input type="text" id="fi-data" value="' + (item.data || '') + '" placeholder="DD/MM/AAAA"></div>' +
      '<div class="form-group"><label>Parcela</label><input type="text" id="fi-parcela" value="' + (item.parcela || '') + '" placeholder="Ex: 1 de 10"></div>' +
      '<button type="submit" class="config-btn save" style="width:100%; margin-top: 12px;">💾 Salvar</button>' +
      '<button type="button" class="config-btn test" style="width:100%; margin-top: 8px; background: var(--red-dim); color: var(--red);" onclick="deleteFaturaItemUI(\'' + faturaId + '\', \'' + itemId + '\')">🗑️ Excluir</button></form>'
    );
  };

  window.submitEditFaturaItem = async function (e, faturaId, itemId) {
    e.preventDefault();
    await DB.updateFaturaItem(faturaId, itemId, {
      nome: document.getElementById('fi-nome').value,
      valor: parseFloat(document.getElementById('fi-valor').value),
      data: document.getElementById('fi-data').value || '',
      parcela: document.getElementById('fi-parcela').value || ''
    });
    closeModal(); await render();
  };

  window.deleteFaturaItemUI = async function (faturaId, itemId) {
    if (!confirm('Remover este item?')) return;
    await DB.deleteFaturaItem(faturaId, itemId);
    closeModal(); await render();
  };

  window.setFaturaPaga = async function (faturaId, status) {
    if (status && !confirm('Confirmar pagamento desta fatura?')) return;
    await DB.updateFatura(faturaId, { pago: status });
    await render();
  };

  async function processarBeneficiosPendentes() {
    if (!cachedData.faturas || !cachedInvestimentos || !cachedInvestimentos.personInv) return;
    const hoje = new Date();
    let houveMudanca = false;

    for (const [id, f] of Object.entries(cachedData.faturas)) {
      if (f.pago && f.beneficio && f.beneficio.tipo !== 'nenhum' && !f.beneficio.processado) {
        // Verificar se já passou do vencimento
        let dataVenc;
        if (f.mes && f.mes.includes('-')) {
          const [fAno, fMes] = f.mes.split('-').map(Number);
          const diaVenc = parseInt(f.vencimento) || 28;
          dataVenc = new Date(fAno, fMes - 1, diaVenc);
        } else {
          // Fallback seguro caso o campo mes esteja corrompido ou em outro formato
          continue;
        }

        // O benefício ocorre APÓS o vencimento e pagamento
        if (hoje > dataVenc) {
          const valorFatura = f.total || 0;
          let ganho = 0;
          if (f.beneficio.tipo === 'cashback') {
            ganho = valorFatura * (f.beneficio.valor / 100);
          } else if (f.beneficio.tipo === 'pontos') {
            ganho = valorFatura / (f.beneficio.valor || 1); // Ex: 1 ponto a cada R$ 5
          }

          if (ganho > 0 && f.beneficio.investId) {
            const inv = cachedInvestimentos.personInv[f.beneficio.investId];
            if (inv) {
              await DB.updateInvestimento(f.beneficio.investId, { valor: inv.valor + ganho });
              const novoBen = { ...f.beneficio, processado: true, valorGanho: ganho, dataProcessado: new Date().toISOString() };
              await DB.updateFatura(id, { beneficio: novoBen });
              console.log(`🎁 [AUTO] Benefício de ${ganho.toFixed(2)} processado para ${inv.nome} (Fatura ${f.cartao})`);
              houveMudanca = true;
            }
          }
        }
      }
    }
    if (houveMudanca) await render();
  }

  window.onInvestValorChange = function (inputEl, valorAntigo) {
    const valStr = inputEl.value.replace(',', '.');
    const novoValor = parseFloat(valStr) || 0;
    const diff = novoValor - valorAntigo;
    const container = document.getElementById('tipo-ajuste-container');
    const select = document.getElementById('inv-tipo-ajuste');
    const label = document.getElementById('tipo-ajuste-label');

    if (Math.abs(diff) >= 0.01) {
      container.style.display = 'block';
      select.setAttribute('required', 'required');
      if (diff > 0) {
        label.innerText = '💎 Origem do Aumento';
        select.innerHTML = '<option value="" disabled selected>-- Selecione --</option><option value="aporte">💰 Aporte Próprio (Gasto)</option><option value="rendimento">📈 Rendimento/Valorização (Sem Transação)</option>';
      } else {
        label.innerText = '📉 Natureza da Redução';
        select.innerHTML = '<option value="" disabled selected>-- Selecione --</option><option value="resgate">💰 Resgate/Retirada (Receita)</option><option value="prejuizo">📉 Oscilação Negativa (Sem Transação)</option>';
      }
    } else {
      container.style.display = 'none';
      select.removeAttribute('required');
    }
  };

  // ====== CRUD INVESTIMENTOS UI ======
  window.saveCotacao = async function (val) {
    const novaCotacao = parseFloat(val);
    if (isNaN(novaCotacao)) return;

    if (useFirebase && typeof DB !== 'undefined') {
      await DB.setCotacaoDolar(monthKeys[currentMonth], novaCotacao);
      await render(); // Recarrega tudo
    }
  };

  window.openAddInvestimentoModal = function () {
    showModal(`
    <div class="modal-header">
      <h3>💎 Novo Investimento</h3>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <form id="add-inv-form" onsubmit="submitInvestimento(event)">
      <div class="form-group">
        <label>Nome do Ativo</label>
        <input type="text" id="inv-nome" placeholder="Ex: Ações Apple, CDB..." required>
      </div>
      <div class="form-group">
        <label>Valor</label>
        <input type="number" id="inv-valor" step="0.01" min="0" placeholder="0.00" required>
      </div>
      <div class="form-group">
        <label>Moeda</label>
        <select id="inv-moeda">
          <option value="BRL">Real (R$)</option>
          <option value="USD">Dólar (US$)</option>
        </select>
      </div>
      <button type="submit" class="config-btn save" style="width:100%; margin-top: 12px;">✅ Salvar</button>
    </form>
  `);
  };

  window.openEditInvestimentoModal = function (id) {
    if (!cachedInvestimentos || !cachedInvestimentos.personInv) return;
    const inv = cachedInvestimentos.personInv[id];
    if (!inv) return;

    showModal(`
    <div class="modal-header">
      <h3>✏️ Editar Investimento</h3>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <form id="edit-inv-form" onsubmit="submitInvestimento(event, '${id}')">
      <div class="form-group">
        <label>Nome do Ativo</label>
        <input type="text" id="inv-nome" value="${inv.nome}" required>
      </div>
      <div class="form-group">
      <label>Valor</label>
      <input type="text" id="inv-valor" value="${inv.valor}" required 
             oninput="window.onInvestValorChange(this, ${inv.valor})">
      <small style="opacity:0.5; font-size:0.7rem;">Use ponto ou vírgula para decimais.</small>
    </div>
      <div class="form-group">
        <label>Moeda</label>
        <select id="inv-moeda">
          <option value="BRL" ${inv.moeda === 'BRL' ? 'selected' : ''}>Real (R$)</option>
          <option value="USD" ${inv.moeda === 'USD' ? 'selected' : ''}>Dólar (US$)</option>
        </select>
      </div>

      <div id="tipo-ajuste-container" style="display:none; margin-top: 10px; padding: 12px; background: rgba(0, 122, 255, 0.08); border: 1px solid rgba(0, 122, 255, 0.3); border-radius: 12px;">
      <label id="tipo-ajuste-label" style="font-weight:600; color:var(--blue); display:block; margin-bottom:10px; font-size:0.85rem;">💎 Natureza da Alteração</label>
      <select id="inv-tipo-ajuste" required style="width:100%; padding:10px; border-radius:8px; background: var(--bg-card); border: 1px solid rgba(255,255,255,0.1); color: var(--text-primary); font-size:0.9rem;">
        <option value="" disabled selected>-- Selecione o motivo --</option>
        <option value="aporte">💰 Aporte Próprio (Gasto)</option>
        <option value="rendimento">📈 Rendimento/Valorização (Sem Transação)</option>
      </select>
    </div>
      <button type="submit" class="config-btn save" style="width:100%; margin-top: 12px;">💾 Atualizar</button>
    </form>
  `);
  };

  window.submitInvestimento = async function (e, id = null) {
    e.preventDefault();
    const nome = document.getElementById('inv-nome').value;
    const valStr = document.getElementById('inv-valor').value.replace(',', '.');
    const valorNovo = parseFloat(valStr) || 0;
    const moeda = document.getElementById('inv-moeda').value;
    const pessoa = currentPerson === 'todos' ? 'gabriel' : currentPerson;
    const mesKey = monthKeys[currentMonth];

    const dados = { pessoa, mes: mesKey, nome, valor: valorNovo, moeda };

    if (id) {
      let valorAntigo = 0;
      if (cachedInvestimentos && cachedInvestimentos.personInv && cachedInvestimentos.personInv[id]) {
        valorAntigo = cachedInvestimentos.personInv[id].valor || 0;
      }
      const diff = valorNovo - valorAntigo;

      await DB.updateInvestimento(id, dados);

      // Registrar Gasto ou Receita se houve alteração de valor manual na aba Investimentos
      if (Math.abs(diff) > 0.01) {
        const agora = new Date();
        const dataHoje = `${String(agora.getDate()).padStart(2, '0')}/${String(agora.getMonth() + 1).padStart(2, '0')}/${agora.getFullYear()}`;
        const tipoAjuste = document.getElementById('inv-tipo-ajuste')?.value || 'aporte';

        // Se for rendimento ou prejuízo, NÃO gera transação
        if (tipoAjuste === 'rendimento' || tipoAjuste === 'prejuizo') {
          console.log(`📈 Rendimento de R$ ${diff.toFixed(2)} registrado apenas no saldo.`);
          closeModal();
          await render();
          return;
        }

        let tipoTrans, catTrans, descTrans;

        if (diff > 0) {
          tipoTrans = 'despesa';
          catTrans = 'Investimento';
          descTrans = `Ajuste manual (Aporte): ${nome}`;
        } else {
          tipoTrans = 'receita';
          catTrans = 'Retirada Investimento';
          descTrans = `Ajuste manual (Retirada): ${nome}`;
        }

        const transAuto = {
          pessoa,
          mes: mesKey,
          tipo: tipoTrans,
          data: dataHoje,
          categoria: catTrans,
          descricao: descTrans,
          valor: Math.abs(diff),
          investId: id
        };
        await DB.addTransacao(transAuto);
        console.log(`✨ Transação automática de ajuste registrada: ${transAuto.categoria} de R$ ${transAuto.valor}`);
      }
    } else {
      // Novo investimento direto da aba investimentos não gera transação automática (é apenas o cadastro do saldo inicial)
      await DB.addInvestimento(dados);
    }
    closeModal();
    await render();
  };

  window.deleteInvestimentoUI = async function (id) {
    if (!confirm('Remover este investimento?')) return;
    await DB.deleteInvestimento(id);
    await render();
  };

  window.deleteItem = async function (id) {
    if (!confirm('Remover esta transação?')) return;

    // Lógica de reversão de saldo se vinculado a investimento
    const all = [...(cachedData.receitas || []), ...(cachedData.gastos || [])];
    const t = all.find(x => x.id === id);
    if (t && t.investId) {
      if (cachedInvestimentos && cachedInvestimentos.personInv) {
        const inv = cachedInvestimentos.personInv[t.investId];
        if (inv) {
          const fator = t.categoria === 'Retirada Investimento' ? 1 : -1;
          await DB.updateInvestimento(t.investId, { valor: inv.valor + (t.valor * fator) });
          console.log(`🔄 Saldo de ${inv.nome} revertido após exclusão.`);
        }
      }
    }

    const ok = await DB.deleteTransacao(id);
    if (ok) await render();
  };

  // ====== RE-GERAR MÊS ======
  window.reGenerateNextMonth = async function () {
    // SEMPRE usar o mês REAL atual como base (não o mês selecionado na aba)
    const now = new Date();
    const mesAtualKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const proximoMesKey = DB._getProximoMes(mesAtualKey);

    if (!confirm('Isso vai APAGAR todos os dados de ' + DB._getMesLabel(proximoMesKey) + ' e re-gerar a partir de ' + DB._getMesLabel(mesAtualKey) + '. Continuar?')) return;

    showConfigMessage('🔄 Re-gerando ' + DB._getMesLabel(proximoMesKey) + '...', 'var(--orange)');

    try {
      // Limpar mês de Abril se foi gerado por engano
      const mesAdiante = DB._getProximoMes(proximoMesKey);
      const snapExtra = await firebase.database().ref('transacoes').orderByChild('mes').equalTo(mesAdiante).limitToFirst(1).once('value');
      if (snapExtra.exists()) {
        console.log('🗑️ Limpando mês extra gerado por engano:', mesAdiante);
        const del = {};
        const s1 = await firebase.database().ref('transacoes').orderByChild('mes').equalTo(mesAdiante).once('value');
        Object.keys(s1.val() || {}).forEach(function (id) { del['transacoes/' + id] = null; });
        const s2 = await firebase.database().ref('faturas').orderByChild('mes').equalTo(mesAdiante).once('value');
        Object.keys(s2.val() || {}).forEach(function (id) { del['faturas/' + id] = null; });
        const s3 = await firebase.database().ref('investimentos').orderByChild('mes').equalTo(mesAdiante).once('value');
        Object.keys(s3.val() || {}).forEach(function (id) { del['investimentos/' + id] = null; });
        if (Object.keys(del).length > 0) await firebase.database().ref().update(del);
        // Remover da lista de meses na UI
        const slugExtra = Object.entries(monthKeys).find(function (e) { return e[1] === mesAdiante; });
        if (slugExtra) {
          const idx = months.indexOf(slugExtra[0]);
          if (idx > -1) months.splice(idx, 1);
          delete monthKeys[slugExtra[0]];
          delete monthLabels[slugExtra[0]];
          delete monthFull[slugExtra[0]];
        }
        console.log('✅ Mês extra', mesAdiante, 'removido');
      }

      await DB.reGerarMes(mesAtualKey, proximoMesKey, ['gabriel', 'clara']);
      addMonthToSystem(proximoMesKey);
      currentMonth = Object.entries(monthKeys).find(([, v]) => v === mesAtualKey)?.[0] || currentMonth;
      showConfigMessage('✅ ' + DB._getMesLabel(proximoMesKey) + ' re-gerado com sucesso!', 'var(--green)');
      await render();
    } catch (e) {
      showConfigMessage('❌ Erro: ' + e.message, 'var(--red)');
      console.error(e);
    }
  };

  // ====== IMPORTAR INVESTIMENTOS CLARA (DEZ/JAN/FEV) ======
  async function importarInvestimentosClara(mesKey, dados) {
    if (!confirm(`Importar investimentos de Clara para ${DB._getMesLabel(mesKey)}?`)) return;

    showConfigMessage('🔄 Importando...', 'var(--orange)');

    try {
      // Verificar se já existem
      const check = await DB.getInvestimentos('clara', mesKey);
      if (Object.keys(check).length > 0) {
        showConfigMessage(`⚠️ Já existem investimentos para Clara em ${mesKey}.`, 'var(--text-secondary)');
        return;
      }

      for (const item of dados) {
        await DB.addInvestimento({ pessoa: 'clara', mes: mesKey, ...item });
      }

      showConfigMessage(`✅ Investimentos de Clara (${mesKey}) importados!`, 'var(--green)');
      await render();
    } catch (e) {
      showConfigMessage('❌ Erro: ' + e.message, 'var(--red)');
    }
  }

  window.importarInvestimentosClaraNov = () => importarInvestimentosClara('2025-11', [
    { nome: 'Casamento', valor: 1464 },
    { nome: 'Reserva', valor: 2435 }
  ]);

  window.importarInvestimentosClaraDez = () => importarInvestimentosClara('2025-12', [
    { nome: 'Casamento', valor: 1484 },
    { nome: 'Reserva', valor: 1935 }
  ]);

  window.importarInvestimentosClaraJan = () => importarInvestimentosClara('2026-01', [
    { nome: 'Casamento', valor: 1504.14 },
    { nome: 'Reserva', valor: 1388 }
  ]);

  window.importarInvestimentosClaraFev = () => importarInvestimentosClara('2026-02', [
    { nome: 'Casamento', valor: 1525 },
    { nome: 'Reserva', valor: 1738 }
  ]);

  // ====== EVENTS ======
  function bindEvents() {
    document.addEventListener('click', (e) => {
      // Dropdown toggle
      const filterBtn = e.target.closest('#personFilterBtn');
      if (filterBtn) {
        document.getElementById('personDropdown').classList.toggle('show');
        return;
      }

      // Dropdown item selection
      const pItem = e.target.closest('.p-item');
      if (pItem) {
        currentPerson = pItem.dataset.person;
        document.getElementById('personDropdown').classList.remove('show');
        render();
        return;
      }

      // Close dropdown if clicked outside
      if (!e.target.closest('.person-filter-container')) {
        const dd = document.getElementById('personDropdown');
        if (dd && dd.classList.contains('show')) dd.classList.remove('show');
      }

      const monthBtn = e.target.closest('.month-btn');
      if (monthBtn) { currentMonth = monthBtn.dataset.month; render(); return; }

      const navItem = e.target.closest('.nav-item');
      if (navItem) { currentPage = navItem.dataset.page; render(); return; }

      // Investimento Edit/Delete (delegation)
      const btnEditInv = e.target.closest('.btn-edit-inv');
      if (btnEditInv) { openEditInvestimentoModal(btnEditInv.dataset.id); return; }

      const btnDelInv = e.target.closest('.btn-del-inv');
      if (btnDelInv) { deleteInvestimentoUI(btnDelInv.dataset.id); return; }
    });
  }

  // ====== GLOBAL FUNCTIONS ======
  window.navigateTo = function (page) { currentPage = page; render(); };

  window.toggleFatura = function (key) {
    const card = document.querySelector(`.fatura-card[data-fatura="${key}"]`);
    if (card) card.classList.toggle('open');
  };

  window.testFirebaseConnection = async function () {
    showConfigMessage('🔄 Testando conexão Firebase...', 'var(--blue)');
    try {
      const ok = await DB.testConnection();
      if (ok) {
        showConfigMessage('✅ Firebase conectado! Dados carregados com sucesso.', 'var(--green)');
      } else {
        showConfigMessage('⚠️ Firebase conectado mas sem dados. Importe o JSON primeiro.', 'var(--orange)');
      }
    } catch (e) {
      showConfigMessage('❌ Falha na conexão Firebase: ' + e.message, 'var(--red)');
    }
  };

  function showConfigMessage(msg, color) {
    const el = document.getElementById('config-message');
    if (el) {
      el.style.display = 'block';
      el.style.color = color;
      el.style.fontSize = '0.85rem';
      el.style.textAlign = 'center';
      el.style.padding = '12px';
      el.style.background = 'var(--bg-card)';
      el.style.borderRadius = 'var(--radius-md)';
      el.style.marginBottom = '16px';
      el.textContent = msg;
    }
  }

  window.limparDadosOrfaos = async function () {
    if (!confirm('Deseja executar a LIMPEZA RADICAL? Isso apagará permanentemente todas as transações que não têm um dono (Gabriel ou Clara). Esta ação não pode ser desfeita.')) return;

    showConfigMessage('🗑️ Iniciando limpeza radical...', 'var(--red)');
    try {
      const total = await DB.limparDadosOrfaos();
      if (typeof total === 'number' && total > 0) {
        showConfigMessage(`✅ Limpeza concluída! ${total} itens inconsistentes foram removidos.`, 'var(--green)');
        await render();
      } else {
        showConfigMessage('✨ Nenhum item órfão encontrado para limpar.', 'var(--text-secondary)');
      }
    } catch (e) {
      showConfigMessage('❌ Erro na limpeza: ' + e.message, 'var(--red)');
    }
  };

  // ====== IMPORTAR INVESTIMENTOS CLARA (DEZ/JAN/FEV) ======
  async function importarInvestimentosClara(mesKey, dados) {
    if (!confirm(`Importar investimentos de Clara para ${DB._getMesLabel(mesKey)}?`)) return;

    showConfigMessage('🔄 Importando...', 'var(--orange)');

    try {
      const check = await DB.getInvestimentos('clara', mesKey);
      if (Object.keys(check).length > 0) {
        showConfigMessage(`⚠️ Já existem investimentos para Clara em ${mesKey}.`, 'var(--text-secondary)');
        return;
      }

      for (const item of dados) {
        await DB.addInvestimento({ pessoa: 'clara', mes: mesKey, ...item });
      }

      showConfigMessage(`✅ Investimentos de Clara (${mesKey}) importados!`, 'var(--green)');
      await render();
    } catch (e) {
      showConfigMessage('❌ Erro: ' + e.message, 'var(--red)');
    }
  }

  window.importarInvestimentosClaraNov = () => importarInvestimentosClara('2025-11', [
    { nome: 'Casamento', valor: 1464 },
    { nome: 'Reserva', valor: 2435 }
  ]);

  window.importarInvestimentosClaraDez = () => importarInvestimentosClara('2025-12', [
    { nome: 'Casamento', valor: 1484 },
    { nome: 'Reserva', valor: 1935 }
  ]);

  window.importarInvestimentosClaraJan = () => importarInvestimentosClara('2026-01', [
    { nome: 'Casamento', valor: 1530 },
    { nome: 'Reserva', valor: 2135 }
  ]);

  window.importarInvestimentosClaraFev = () => importarInvestimentosClara('2026-02', [
    { nome: 'Casamento', valor: 1530 },
    { nome: 'Reserva', valor: 2135 }
  ]);

  window.reGenerateNextMonth = async function () {
    const now = new Date();
    const mesAtualKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const proximoMesKey = DB._getProximoMes(mesAtualKey);

    if (!confirm(`Isso irá apagar todos os dados de ${DB._getMesLabel(proximoMesKey)} e recriá-los com base no mês atual (${DB._getMesLabel(mesAtualKey)}). Deseja continuar?`)) return;

    showConfigMessage('🔄 Re-gerando mês...', 'var(--orange)');
    try {
      await DB.reGerarMes(mesAtualKey, proximoMesKey, ['gabriel', 'clara']);
      showConfigMessage(`✅ Mês ${DB._getMesLabel(proximoMesKey)} re-gerado com sucesso!`, 'var(--green)');

      // Adicionar novo mês ao sistema se não existir
      addMonthToSystem(proximoMesKey);
      await render();
    } catch (e) {
      showConfigMessage('❌ Erro: ' + e.message, 'var(--red)');
    }
  };

  window.updateParcelaLogic = function () {
    const elAtual = document.getElementById('f-parcela-atual');
    const elTotal = document.getElementById('f-parcela-total');
    const elDataFim = document.getElementById('f-dataFinal');
    const elDataTrans = document.getElementById('f-data');

    if (!elAtual || !elTotal || !elDataFim || !elDataTrans) return;

    const atual = parseInt(elAtual.value) || 1;
    const dataFim = elDataFim.value;
    const dataTrans = elDataTrans.value; // YYYY-MM-DD

    if (dataFim && dataFim.includes('/') && dataTrans) {
      const partsFim = dataFim.split('/');
      const mesFim = parseInt(partsFim[0]);
      const anoFim = parseInt(partsFim[1]);
      const [anoT, mesT] = dataTrans.split('-').map(Number);

      if (mesFim && anoFim && mesT && anoT) {
        const diff = (anoFim - anoT) * 12 + (mesFim - mesT);
        if (diff >= 0) {
          elTotal.value = atual + diff;
        }
      }
    }
  };

  window.openRecorrenteDetail = async function (recId) {
    showModal('<div style="padding:20px; text-align:center;"><div class="spinner"></div><p>Carregando histórico...</p></div>');
    const compromissos = await DB.getHistoricoRecorrentes(currentPerson === 'todos' ? 'todos' : currentPerson);
    const c = compromissos.find(x => x.id === recId);
    if (!c) {
      showModal('<div style="padding:20px; text-align:center;"><h3>Compromisso não encontrado</h3><button class="config-btn" onclick="closeModal()">Fechar</button></div>');
      return;
    }

    showModal(`
      <div class="modal-header">
        <h3>🔁 Detalhes: ${c.descricao}</h3>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="recorrente-detail" style="padding: 10px 0;">
        <div class="summary-grid" style="grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <div class="summary-card" style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
            <div class="label" style="font-size: 0.7rem; opacity: 0.6; text-transform: uppercase;">Total Pago</div>
            <div class="value" style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">${formatCurrency(c.valorTotalPago)}</div>
          </div>
          <div class="summary-card" style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
            <div class="label" style="font-size: 0.7rem; opacity: 0.6; text-transform: uppercase;">Meses Pagos</div>
            <div class="value" style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">${c.mesesPagos}</div>
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.02); border-radius: 12px; padding: 15px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem;">
            <span style="opacity:0.6;">Categoria:</span> <strong>${c.categoria}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem;">
            <span style="opacity:0.6;">Parcela Atual:</span> <span class="cat-badge" style="background:var(--purple); color:white; padding:2px 8px; border-radius:10px;">${c.parcelaMaisRecente}</span>
          </div>
          ${c.dataFinal ? `
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem;">
            <span style="opacity:0.6;">Data Fim:</span> <strong>${c.dataFinal}</strong>
          </div>` : ''}
          <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
            <span style="opacity:0.6;">Pessoa:</span> <strong>${c.pessoa}</strong>
          </div>
        </div>

        <div class="section-title" style="margin-top: 20px; font-size: 1rem; border:none; padding-left:0;">
          📜 Histórico de Pagamentos
        </div>
        <div class="transaction-list" style="max-height: 250px; overflow-y: auto; margin-top: 10px;">
          ${c.historico.sort((a, b) => b.mes.localeCompare(a.mes)).map(h => {
      const now = new Date();
      const mesAtualProg = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const isFuturo = h.mes > mesAtualProg;

      return `
              <div class="transaction-item" onclick="closeModal(); openEditModal('${h.id}')" style="cursor:pointer; background: ${isFuturo ? 'rgba(10, 132, 255, 0.05)' : 'rgba(255,255,255,0.02)'}; margin-bottom: 8px; border: 1px solid ${isFuturo ? 'rgba(10, 132, 255, 0.2)' : 'rgba(255,255,255,0.03)'};">
                <div class="info">
                  <div class="name" style="font-size:0.9rem;">
                    ${DB._getMesLabel(h.mes)}
                    ${isFuturo ? '<span style="font-size:0.6rem; background:var(--blue-dim); color:var(--blue); padding:1px 4px; border-radius:4px; margin-left:5px;">PREVISTO</span>' : ''}
                  </div>
                  <div class="desc" style="font-size:0.75rem;">${h.parcela}</div>
                </div>
                <div class="amount ${isFuturo ? '' : 'negative'}" style="font-size:0.9rem; opacity: ${isFuturo ? '0.6' : '1'};">
                  ${formatCurrency(h.valor)}
                </div>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `);
  };

  // ====== START ======
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
