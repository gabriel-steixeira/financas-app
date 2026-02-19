// =============================================
// FINANÇAS APP - Main Application
// =============================================

(function () {
  'use strict';

  // State
  let currentPerson = 'gabriel';
  let currentMonth = 'fevereiro';
  let currentPage = 'dashboard';

  const months = ['novembro', 'dezembro', 'janeiro', 'fevereiro'];
  const monthLabels = { novembro: 'Nov', dezembro: 'Dez', janeiro: 'Jan', fevereiro: 'Fev' };
  const monthFull = { novembro: 'Novembro 2025', dezembro: 'Dezembro 2025', janeiro: 'Janeiro 2026', fevereiro: 'Fevereiro 2026' };

  // DOM References
  const app = document.getElementById('app');

  // ====== INIT ======
  function init() {
    render();
    bindEvents();
  }

  // ====== RENDER ======
  function render() {
    const isConfig = currentPage === 'config';
    app.innerHTML = `
      ${renderHeader()}
      ${!isConfig ? renderMonthSelector() : ''}
      ${renderDashboard()}
      ${renderReceitas()}
      ${renderGastos()}
      ${renderFaturas()}
      ${renderInvestimentos()}
      ${renderConfig()}
      ${renderBottomNav()}
    `;
    bindPageEvents();
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

  // ====== GET DATA ======
  function getData() {
    return FINANCAS_DATA[currentPerson]?.[currentMonth] || { receitas: [], gastos: [], faturas: {} };
  }

  // ====== DASHBOARD ======
  function renderDashboard() {
    const data = getData();
    const totalReceitas = getTotalReceitas(data);
    const totalGastos = getTotalGastos(data);
    const saldo = totalReceitas - totalGastos;

    // Chart data for all months
    const chartData = months.map(m => {
      const d = FINANCAS_DATA[currentPerson]?.[m];
      if (!d) return { income: 0, expense: 0 };
      return { income: getTotalReceitas(d), expense: getTotalGastos(d) };
    });
    const maxChart = Math.max(...chartData.flatMap(d => [d.income, d.expense]), 1);

    // Recent transactions (last 5)
    const allTransactions = [
      ...data.receitas.map(r => ({ ...r, type: 'receita' })),
      ...data.gastos.map(g => ({ ...g, type: 'gasto' })),
    ].slice(0, 6);

    return `
      <div class="page ${currentPage === 'dashboard' ? 'active' : ''}" id="page-dashboard">
        <!-- Balance Card -->
        <div class="balance-card">
          <div class="label">Saldo do Mês</div>
          <div class="amount ${saldo >= 0 ? 'positive' : 'negative'}">${formatCurrency(saldo)}</div>
          <div class="detail">
            <span><span class="dot green"></span> Receitas: ${formatCurrency(totalReceitas)}</span>
            <span><span class="dot red"></span> Gastos: ${formatCurrency(totalGastos)}</span>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="summary-grid">
          <div class="summary-card" onclick="navigateTo('receitas')">
            <div class="icon green">📥</div>
            <div class="label">Receitas</div>
            <div class="value positive">${formatCurrency(totalReceitas)}</div>
          </div>
          <div class="summary-card" onclick="navigateTo('gastos')">
            <div class="icon red">📤</div>
            <div class="label">Gastos</div>
            <div class="value negative">${formatCurrency(totalGastos)}</div>
          </div>
          <div class="summary-card" onclick="navigateTo('faturas')">
            <div class="icon orange">💳</div>
            <div class="label">Faturas</div>
            <div class="value">${Object.keys(data.faturas || {}).length} cartões</div>
          </div>
          <div class="summary-card" onclick="navigateTo('investimentos')">
            <div class="icon purple">💎</div>
            <div class="label">Investimentos</div>
            <div class="value positive">${formatCurrency(FINANCAS_DATA.investimentos.totais[currentMonth] || 0)}</div>
          </div>
        </div>

        <!-- Chart -->
        <div class="chart-container">
          <h3>📊 Receitas vs Gastos</h3>
          <div class="bar-chart">
            ${chartData.map((d, i) => `
              <div class="bar-group">
                <div class="bar-pair">
                  <div class="bar income" style="height: ${(d.income / maxChart) * 100}%"></div>
                  <div class="bar expense" style="height: ${(d.expense / maxChart) * 100}%"></div>
                </div>
                <div class="bar-label">${monthLabels[months[i]]}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Recent Transactions -->
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
    const data = getData();
    const total = getTotalReceitas(data);

    return `
      <div class="page ${currentPage === 'receitas' ? 'active' : ''}" id="page-receitas">
        <div class="balance-card" style="background: linear-gradient(135deg, #0a2e1a 0%, #0f3d1e 50%, #164d26 100%);">
          <div class="label">Total de Receitas</div>
          <div class="amount positive">${formatCurrency(total)}</div>
          <div class="detail">
            <span>${data.receitas.length} entradas neste mês</span>
          </div>
        </div>

        <div class="section-title">
          Todas as Receitas
          <span class="count">${data.receitas.length}</span>
        </div>
        <div class="transaction-list">
          ${data.receitas.map((r, i) => renderTransactionItem({ ...r, type: 'receita' }, i)).join('')}
        </div>
      </div>
    `;
  }

  // ====== GASTOS ======
  function renderGastos() {
    const data = getData();
    const total = getTotalGastos(data);

    // Group by category
    const byCategory = {};
    data.gastos.forEach(g => {
      if (!byCategory[g.categoria]) byCategory[g.categoria] = { total: 0, count: 0 };
      byCategory[g.categoria].total += g.valor;
      byCategory[g.categoria].count++;
    });

    const categoryColors = {
      'Investimento': 'var(--purple)',
      'Boleto': 'var(--orange)',
      'Fatura cartão': 'var(--red)',
      'Presente': 'var(--blue)',
      'Transporte': 'var(--yellow)',
      'Alimentação': 'var(--teal)',
    };

    return `
      <div class="page ${currentPage === 'gastos' ? 'active' : ''}" id="page-gastos">
        <div class="balance-card" style="background: linear-gradient(135deg, #2e0a0a 0%, #3d0f0f 50%, #4d1616 100%);">
          <div class="label">Total de Gastos</div>
          <div class="amount negative">${formatCurrency(total)}</div>
          <div class="detail">
            <span>${data.gastos.length} saídas neste mês</span>
          </div>
        </div>

        <!-- Categories Breakdown -->
        <div class="chart-container">
          <h3>📊 Por Categoria</h3>
          <div class="donut-container">
            <svg class="donut" viewBox="0 0 42 42">
              ${renderDonut(byCategory, categoryColors, total)}
            </svg>
            <div class="donut-legend">
              ${Object.entries(byCategory).map(([cat, info]) => `
                <div class="legend-item">
                  <span class="legend-dot" style="background: ${categoryColors[cat] || 'var(--text-tertiary)'}"></span>
                  <span class="legend-label">${cat}</span>
                  <span class="legend-value">${Math.round(info.total / total * 100)}%</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="section-title">
          Todos os Gastos
          <span class="count">${data.gastos.length}</span>
        </div>
        <div class="transaction-list">
          ${data.gastos.map((g, i) => renderTransactionItem({ ...g, type: 'gasto' }, i)).join('')}
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
    const data = getData();
    const faturas = data.faturas || {};
    const keys = Object.keys(faturas);

    return `
      <div class="page ${currentPage === 'faturas' ? 'active' : ''}" id="page-faturas">
        <div class="balance-card" style="background: linear-gradient(135deg, #1a0a2e 0%, #2e0f3d 50%, #3d164d 100%);">
          <div class="label">Total de Faturas</div>
          <div class="amount negative">${formatCurrency(keys.reduce((s, k) => s + faturas[k].total, 0))}</div>
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
      return `
            <div class="fatura-card" data-fatura="${key}" style="animation-delay: ${i * 80}ms">
              <div class="fatura-header" onclick="toggleFatura('${key}')">
                <div class="left">
                  <div class="card-icon">💳</div>
                  <div>
                    <div class="card-name">${f.nome}</div>
                    <div class="card-total">${f.itens.length} itens</div>
                  </div>
                </div>
                <div style="text-align: right; display: flex; align-items: center; gap: 10px;">
                  <div class="total-value">${formatCurrency(f.total)}</div>
                  <span class="chevron">▼</span>
                </div>
              </div>
              <div class="fatura-items">
                ${f.itens.map(item => `
                  <div class="fatura-item">
                    <div class="item-info">
                      <div class="item-name">${item.nome}</div>
                      <div class="item-parcela">${item.parcela}${item.data ? ' • ' + item.data : ''}</div>
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
    const inv = FINANCAS_DATA.investimentos;
    const personInv = inv[currentPerson] || {};
    const entries = Object.entries(personInv);

    const totalPerson = entries.reduce((sum, [, vals]) => {
      return sum + (vals[currentMonth] || 0);
    }, 0);

    return `
      <div class="page ${currentPage === 'investimentos' ? 'active' : ''}" id="page-investimentos">
        <div class="balance-card" style="background: linear-gradient(135deg, #0a1a2e 0%, #0f2a4d 50%, #143d6b 100%);">
          <div class="label">Patrimônio Total (Casal)</div>
          <div class="amount positive">${formatCurrency(inv.totais[currentMonth] || 0)}</div>
          <div class="detail">
            <span>Cotação dólar: ${formatCurrency(inv.cotacaoDolar)}</span>
          </div>
        </div>

        <div class="section-title">
          ${currentPerson === 'gabriel' ? 'Gabriel' : 'Clara'} - Investimentos
          <span class="count">${formatCurrency(totalPerson)}</span>
        </div>

        ${entries.map(([name, vals], i) => {
      const isUsd = name.includes('USD');
      const monthVals = months.filter(m => m !== 'novembro').map(m => vals[m] || 0);
      const maxVal = Math.max(...monthVals, 1);
      const currentVal = vals[currentMonth] || 0;

      return `
            <div class="invest-card" style="animation-delay: ${i * 100}ms">
              <div class="invest-header">
                <div class="invest-name">${name}</div>
                <div class="invest-value">${isUsd ? formatCurrency(currentVal, 'USD') : formatCurrency(currentVal)}</div>
              </div>
              <div class="invest-evolution">
                ${monthVals.map(v => `
                  <div class="invest-bar" style="height: ${Math.max((v / maxVal) * 100, 5)}%"></div>
                `).join('')}
              </div>
              <div class="invest-months">
                <span>Dez</span>
                <span>Jan</span>
                <span>Fev</span>
              </div>
            </div>
          `;
    }).join('')}

        <!-- Evolução Total -->
        <div class="chart-container" style="margin-top: 20px;">
          <h3>📈 Evolução Patrimônio Total</h3>
          <div class="bar-chart" style="height: 80px;">
            ${months.filter(m => m !== 'novembro').map(m => {
      const val = inv.totais[m] || 0;
      const max = Math.max(...Object.values(inv.totais), 1);
      return `
                <div class="bar-group">
                  <div class="bar-pair">
                    <div class="bar income" style="height: ${(val / max) * 100}%"></div>
                  </div>
                  <div class="bar-label">${monthLabels[m]}</div>
                </div>
              `;
    }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ====== TRANSACTION ITEM ======
  function renderTransactionItem(t, i) {
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
          ${isReceita ? '+' : '-'}${formatCurrency(t.valor)}
          ${t.data ? `<span class="date">${t.data}</span>` : ''}
        </div>
      </div>
    `;
  }

  // ====== CONFIGURAÇÕES ======
  function renderConfig() {
    const config = SheetsService.getConfig();
    const status = SheetsService.getStatus();
    const statusLabel = SheetsService.getStatusLabel();

    return `
      <div class="page ${currentPage === 'config' ? 'active' : ''}" id="page-config">
        <div class="balance-card" style="background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 50%, #3d3d5c 100%);">
          <div class="label">Google Sheets</div>
          <div class="amount" style="font-size: 1.4rem; color: var(--text-primary);">${statusLabel}</div>
          <div class="detail">
            <span>Credenciais salvas no seu navegador (não no código)</span>
          </div>
        </div>

        <div class="section-title">🔑 Credenciais</div>

        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px;">
          <div class="config-field">
            <label class="config-label">API Key</label>
            <input type="password" id="cfg-api-key" class="config-input" 
              placeholder="Cole sua API Key aqui" 
              value="${config.apiKey}" />
            <span class="config-hint">Criada no Google Cloud Console → Credenciais → Chave de API</span>
          </div>

          <div class="config-field">
            <label class="config-label">Client ID (OAuth)</label>
            <input type="password" id="cfg-client-id" class="config-input" 
              placeholder="Cole seu Client ID aqui" 
              value="${config.clientId}" />
            <span class="config-hint">Necessário para escrita. Formato: xxx.apps.googleusercontent.com</span>
          </div>

          <div class="config-field">
            <label class="config-label">Spreadsheet ID</label>
            <input type="text" id="cfg-spreadsheet-id" class="config-input" 
              placeholder="ID da planilha" 
              value="${config.spreadsheetId}" />
            <span class="config-hint">Encontrado na URL: docs.google.com/spreadsheets/d/<b>ID_AQUI</b>/edit</span>
          </div>

          <button class="config-btn save" onclick="saveConfig()">💾 Salvar Credenciais</button>

          ${config.apiKey ? `
            <button class="config-btn test" onclick="testConnection()">🔌 Testar Conexão</button>
          ` : ''}

          ${config.apiKey ? `
            <button class="config-btn danger" onclick="clearConfig()">🗑️ Limpar Credenciais</button>
          ` : ''}
        </div>

        <div id="config-message" style="display: none;"></div>

        <div class="section-title">📖 Como configurar</div>
        <div class="chart-container">
          <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6;">
            <p><strong>1.</strong> Acesse <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color: var(--blue);">Google Cloud Console</a></p>
            <p><strong>2.</strong> Crie uma <strong>Chave de API</strong> e restrinja para o domínio do seu GitHub Pages</p>
            <p><strong>3.</strong> Habilite a <strong>Google Sheets API</strong> no projeto</p>
            <p><strong>4.</strong> Cole as credenciais acima e clique em Salvar</p>
            <p style="margin-top: 8px; color: var(--green);">🔒 Suas credenciais ficam apenas no localStorage deste navegador.</p>
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

  // ====== EVENTS ======
  function bindEvents() {
    // Delegate all clicks
    document.addEventListener('click', (e) => {
      // Person toggle
      const personBtn = e.target.closest('.person-btn');
      if (personBtn) {
        currentPerson = personBtn.dataset.person;
        render();
        return;
      }

      // Month selector
      const monthBtn = e.target.closest('.month-btn');
      if (monthBtn) {
        currentMonth = monthBtn.dataset.month;
        render();
        return;
      }

      // Nav items
      const navItem = e.target.closest('.nav-item');
      if (navItem) {
        currentPage = navItem.dataset.page;
        render();
        return;
      }
    });
  }

  function bindPageEvents() {
    // Nothing additional needed with event delegation
  }

  // ====== GLOBAL FUNCTIONS ======
  window.navigateTo = function (page) {
    currentPage = page;
    render();
  };

  window.toggleFatura = function (key) {
    const card = document.querySelector(`.fatura-card[data-fatura="${key}"]`);
    if (card) card.classList.toggle('open');
  };

  window.saveConfig = function () {
    const apiKey = document.getElementById('cfg-api-key').value.trim();
    const clientId = document.getElementById('cfg-client-id').value.trim();
    const spreadsheetId = document.getElementById('cfg-spreadsheet-id').value.trim();
    SheetsService.saveConfig(clientId, apiKey, spreadsheetId);
    showConfigMessage('✅ Credenciais salvas com sucesso!', 'var(--green)');
    setTimeout(() => render(), 1000);
  };

  window.clearConfig = function () {
    if (confirm('Tem certeza que deseja limpar todas as credenciais?')) {
      SheetsService.clearConfig();
      showConfigMessage('🗑️ Credenciais removidas.', 'var(--orange)');
      setTimeout(() => render(), 1000);
    }
  };

  window.testConnection = async function () {
    showConfigMessage('🔄 Testando conexão...', 'var(--blue)');
    const ok = await SheetsService.init();
    if (ok) {
      const data = await SheetsService.readSheet('Reservas e Investimentos!A1:D12');
      if (data) {
        showConfigMessage('✅ Conexão OK! Dados lidos com sucesso.', 'var(--green)');
      } else {
        showConfigMessage('⚠️ API inicializada mas não conseguiu ler dados. Verifique o Spreadsheet ID.', 'var(--orange)');
      }
    } else {
      showConfigMessage('❌ Falha na conexão. Verifique a API Key.', 'var(--red)');
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
