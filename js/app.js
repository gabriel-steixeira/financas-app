// =============================================
// FINANÇAS APP - Main Application (Firebase)
// =============================================

(function () {
  'use strict';

  // State
  let currentPerson = 'gabriel';
  let currentMonth = 'fevereiro';
  let currentPage = 'dashboard';
  let cachedData = null; // { receitas, gastos, faturas, totalReceitas, totalGastos, saldo }
  let cachedInvestimentos = null;
  let useFirebase = true;
  let loading = false;

  const months = ['novembro', 'dezembro', 'janeiro', 'fevereiro'];
  const monthKeys = { novembro: '2025-11', dezembro: '2025-12', janeiro: '2026-01', fevereiro: '2026-02' };
  const monthLabels = { novembro: 'Nov', dezembro: 'Dez', janeiro: 'Jan', fevereiro: 'Fev' };
  const monthFull = { novembro: 'Novembro 2025', dezembro: 'Dezembro 2025', janeiro: 'Janeiro 2026', fevereiro: 'Fevereiro 2026' };

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
        const totalInfo = await DB.getTotalInvestimentos(mesKey);
        cachedInvestimentos = { personInv, totalInfo };
        return;
      } catch (e) {
        console.warn('⚠️ Firebase investimentos falhou:', e);
      }
    }
    // Fallback
    const inv = FINANCAS_DATA?.investimentos;
    if (inv) {
      const personInv = inv[currentPerson] || {};
      const entries = {};
      Object.entries(personInv).forEach(([name, vals]) => {
        entries[name] = { nome: name, valor: vals[currentMonth] || 0, moeda: name.includes('USD') ? 'USD' : 'BRL' };
      });
      cachedInvestimentos = {
        personInv: entries,
        totalInfo: { total: inv.totais?.[currentMonth] || 0, cotacaoDolar: inv.cotacaoDolar || 5.45 }
      };
    } else {
      cachedInvestimentos = { personInv: {}, totalInfo: { total: 0, cotacaoDolar: 5.45 } };
    }
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
    if (isInvest) await loadInvestimentos();

    const sections = [renderHeader()];
    if (!isConfig) sections.push(renderMonthSelector());
    sections.push(currentPage === 'dashboard' ? await renderDashboard() : renderDashboardHidden());
    sections.push(renderReceitas());
    sections.push(renderGastos());
    sections.push(renderFaturas());
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
    return `
      <div class="header">
        <div class="header-top">
          <div>
            <h1>💰 Finanças</h1>
            <div class="header-subtitle">${monthFull[currentMonth]}</div>
          </div>
          <div class="person-toggle">
            <button class="person-btn ${currentPerson === 'gabriel' ? 'active' : ''}" data-person="gabriel">Gabriel</button>
            <button class="person-btn ${currentPerson === 'clara' ? 'active' : ''}" data-person="clara">Clara</button>
          </div>
        </div>
      </div>
    `;
  }

  // ====== MONTH SELECTOR ======
  function renderMonthSelector() {
    return `
      <div class="month-selector">
        ${months.map(m => `
          <button class="month-btn ${currentMonth === m ? 'active' : ''}" data-month="${m}">
            ${monthLabels[m]} ${m === 'novembro' || m === 'dezembro' ? '25' : '26'}
          </button>
        `).join('')}
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
          <div class="summary-card" onclick="navigateTo('faturas')">
            <div class="icon orange">💳</div>
            <div class="label">Faturas</div>
            <div class="value">${Object.keys(d.faturas || {}).length} cartões</div>
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
          <button class="add-btn" onclick="openAddModal('receita')">➕</button>
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
          <button class="add-btn" onclick="openAddModal('despesa')">➕</button>
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

  // ====== FATURAS ======
  function renderFaturas() {
    if (currentPage !== 'faturas') return `<div class="page" id="page-faturas"></div>`;
    const faturas = cachedData.faturas || {};
    const keys = Object.keys(faturas);

    return `
      <div class="page active" id="page-faturas">
        <div class="balance-card" style="background: linear-gradient(135deg, #1a0a2e 0%, #2e0f3d 50%, #3d164d 100%);">
          <div class="label">Total de Faturas</div>
          <div class="amount negative">${formatCurrency(keys.reduce((s, k) => s + (faturas[k].total || 0), 0))}</div>
          <div class="detail">
            <span>${keys.length} cartões</span>
          </div>
        </div>

        ${keys.length === 0 ? `
          <div class="empty-state">
            <div class="emoji">💳</div>
            <p>Nenhum detalhe de fatura disponível para este mês${currentPerson === 'clara' ? '.<br>Clara organiza faturas no caderno.' : '.'}</p>
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
                    <div class="card-name">${f.nome || key}</div>
                    <div class="card-total">${itens.length} itens</div>
                  </div>
                </div>
                <div style="text-align: right; display: flex; align-items: center; gap: 10px;">
                  <div class="total-value">${formatCurrency(f.total || 0)}</div>
                  <span class="chevron">▼</span>
                </div>
              </div>
              <div class="fatura-items">
                ${itens.map(item => `
                  <div class="fatura-item">
                    <div class="item-info">
                      <div class="item-name">${item.nome}</div>
                      <div class="item-parcela">${item.parcela || ''}${item.data ? ' • ' + item.data : ''}</div>
                    </div>
                    <div class="item-value">${formatCurrency(item.valor)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
    }).join('')}
      </div>
    `;
  }

  // ====== INVESTIMENTOS ======
  function renderInvestimentos() {
    if (currentPage !== 'investimentos') return renderInvestimentosHidden();
    const inv = cachedInvestimentos;
    if (!inv) return renderInvestimentosHidden();

    const entries = Object.entries(inv.personInv);
    const totalPerson = entries.reduce((sum, [, v]) => sum + (v.valor || 0), 0);

    return `
      <div class="page active" id="page-investimentos">
        <div class="balance-card" style="background: linear-gradient(135deg, #0a1a2e 0%, #0f2a4d 50%, #143d6b 100%);">
          <div class="label">Total Investimentos (${currentPerson === 'gabriel' ? 'Gabriel' : 'Clara'})</div>
          <div class="amount positive">${formatCurrency(totalPerson)}</div>
          <div class="detail">
            <span>Cotação dólar: ${formatCurrency(inv.totalInfo.cotacaoDolar)}</span>
          </div>
        </div>

        <div class="section-title">
          ${currentPerson === 'gabriel' ? 'Gabriel' : 'Clara'} - Investimentos
          <span class="count">${entries.length} aplicações</span>
        </div>

        ${entries.map(([name, data], i) => {
      const isUsd = data.moeda === 'USD';
      return `
            <div class="invest-card" style="animation-delay: ${i * 100}ms">
              <div class="invest-header">
                <div class="invest-name">${data.nome || name}</div>
                <div class="invest-value">${isUsd ? formatCurrency(data.valor, 'USD') : formatCurrency(data.valor)}</div>
              </div>
            </div>
          `;
    }).join('')}

        <div class="chart-container" style="margin-top: 20px;">
          <h3>💎 Patrimônio Total</h3>
          <div style="text-align: center; font-size: 1.5rem; color: var(--green); padding: 20px;">
            ${formatCurrency(inv.totalInfo.total)}
          </div>
        </div>
      </div>
    `;
  }

  // ====== TRANSACTION ITEM ======
  function renderTransactionItem(t, i, showDelete = false) {
    const isReceita = t.type === 'receita';
    const icon = getCategoryIcon(t.categoria);
    const catClass = getCategoryClass(t.categoria);
    const colorBg = isReceita ? 'var(--green-dim)' : 'var(--red-dim)';

    return `
      <div class="transaction-item" style="animation-delay: ${i * 40}ms">
        <div class="cat-icon" style="background: ${colorBg}">
          ${icon}
        </div>
        <div class="info">
          <div class="name">${t.descricao || t.categoria}</div>
          <div class="desc">
            <span class="cat-badge ${catClass}">${t.categoria}</span>
            ${t.status ? `<span class="status-badge pago" style="margin-left: 4px">${t.status}</span>` : ''}
          </div>
        </div>
        <div class="amount ${isReceita ? 'positive' : 'negative'}">
          ${isReceita ? '+' : '-'}${formatCurrency(Math.abs(t.valor))}
          ${t.data ? `<span class="date">${t.data}</span>` : ''}
          ${showDelete && t.id ? `<button class="delete-item-btn" onclick="event.stopPropagation(); deleteItem('${t.id}')">🗑️</button>` : ''}
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

        <div class="section-title" style="margin-top: 8px;">ℹ️ Sobre</div>
        <div class="chart-container">
          <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6;">
            <p>💰 <strong>Finanças App</strong> v2.0 🔥</p>
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
      { id: 'faturas', icon: '💳', label: 'Faturas' },
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

    showModal(`
      <div class="modal-header">
        <h3>${tipo === 'receita' ? '📥 Nova Receita' : '📤 Novo Gasto'}</h3>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <form id="add-form" onsubmit="submitAdd(event, '${tipo}')">
        <div class="form-group">
          <label>Data</label>
          <input type="date" id="f-data" required>
        </div>
        <div class="form-group">
          <label>Categoria</label>
          <select id="f-categoria" required>
            ${categorias.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Descrição</label>
          <input type="text" id="f-descricao" placeholder="Ex: Salário, Conta de luz..." required>
        </div>
        <div class="form-group">
          <label>Valor (R$)</label>
          <input type="number" id="f-valor" step="0.01" min="0" placeholder="0,00" required>
        </div>
        <button type="submit" class="config-btn save" style="width:100%; margin-top: 12px;">
          ✅ Adicionar ${tipo === 'receita' ? 'Receita' : 'Gasto'}
        </button>
      </form>
    `);
  };

  window.submitAdd = async function (e, tipo) {
    e.preventDefault();
    const dataInput = document.getElementById('f-data').value;
    const dateParts = dataInput.split('-');
    const dataFormatted = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

    const dados = {
      pessoa: currentPerson,
      mes: monthKeys[currentMonth],
      tipo,
      data: dataFormatted,
      categoria: document.getElementById('f-categoria').value,
      descricao: document.getElementById('f-descricao').value,
      valor: parseFloat(document.getElementById('f-valor').value)
    };

    const key = await DB.addTransacao(dados);
    if (key) {
      closeModal();
      await render();
    } else {
      alert('Erro ao salvar. Verifique o console.');
    }
  };

  window.deleteItem = async function (id) {
    if (!confirm('Remover esta transação?')) return;
    const ok = await DB.deleteTransacao(id);
    if (ok) await render();
  };

  // ====== EVENTS ======
  function bindEvents() {
    document.addEventListener('click', (e) => {
      const personBtn = e.target.closest('.person-btn');
      if (personBtn) { currentPerson = personBtn.dataset.person; render(); return; }

      const monthBtn = e.target.closest('.month-btn');
      if (monthBtn) { currentMonth = monthBtn.dataset.month; render(); return; }

      const navItem = e.target.closest('.nav-item');
      if (navItem) { currentPage = navItem.dataset.page; render(); return; }
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

  // ====== START ======
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
