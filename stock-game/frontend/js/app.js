/**
 * StockQuest v2 - Main Application
 * Flask Backend + Firebase Auth
 */

// ====================
// State Management
// ====================
const state = {
  user: null,
  stocks: [],
  filteredStocks: [],
  selectedStocks: [],
  captain: null,
  viceCaptain: null,
  balance: 1000000,
  maxStocks: 11,
  minStocks: 5,
  filter: 'all',
  searchQuery: '',
  currentStock: null
};

// ====================
// API Client (Flask Backend)
// ====================
const api = {
  baseUrl: '/api',

  async get(endpoint, params = {}) {
    try {
      let url = this.baseUrl + endpoint;
      const queryParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key]) queryParams.append(key, params[key]);
      });
      if (queryParams.toString()) {
        url += '?' + queryParams.toString();
      }

      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      return { success: false, error: error.message };
    }
  },

  async post(endpoint, body = {}) {
    try {
      const response = await fetch(this.baseUrl + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      return { success: false, error: error.message };
    }
  }
};

// ====================
// Utility Functions
// ====================
const utils = {
  formatCurrency(amount) {
    if (!amount || isNaN(amount)) return '--';
    const num = parseFloat(amount);
    if (num >= 10000000) {
      return '₹' + (num / 10000000).toFixed(2) + ' Cr';
    } else if (num >= 100000) {
      return '₹' + (num / 100000).toFixed(2) + ' L';
    } else {
      return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  },

  formatNumber(num) {
    if (!num || isNaN(num)) return '0';
    return parseFloat(num).toLocaleString('en-IN');
  },

  formatPercent(value) {
    if (!value) return '0.00%';
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00%';
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  },

  getChangeClass(change) {
    return change >= 0 ? 'positive' : 'negative';
  },

  // Parse stock data from API response
  parseStock(raw) {
    if (!raw) return null;

    const name = raw.company_name || raw.companyName || raw.name ||
      raw.longName || raw.shortName || raw.stock_name ||
      raw.scrip_name || raw.symbol || 'Unknown';

    const symbol = raw.symbol || raw.ticker || raw.nseSymbol ||
      raw.bseSymbol || raw.stock_id ||
      name.substring(0, 6).toUpperCase().replace(/\s/g, '');

    const parseNum = (val) => {
      if (!val) return 0;
      if (typeof val === 'number') return val;
      if (typeof val === 'object') return parseFloat(val.value || val.price || val.ltp || 0);
      return parseFloat(String(val).replace(/[₹,%+\s,]/g, '')) || 0;
    };

    return {
      id: symbol + '_' + Date.now(),
      name: name,
      symbol: symbol,
      price: parseNum(raw.currentPrice || raw.current_price || raw.price || raw.ltp || raw.lastPrice || raw.close || 0),
      change: parseNum(raw.pChange || raw.change_percent || raw.changePercent || raw.percent_change || 0),
      volume: parseNum(raw.volume || raw.tradedVolume || raw.totalTradedVolume || 0),
      high: parseNum(raw.high || raw.dayHigh || 0),
      low: parseNum(raw.low || raw.dayLow || 0),
      marketCap: parseNum(raw.marketCap || raw.market_cap || 0),
      pe: parseNum(raw.pe || raw.peRatio || 0),
      high52: parseNum(raw.high52 || raw.week52High || raw.yearHigh || 0),
      low52: parseNum(raw.low52 || raw.week52Low || raw.yearLow || 0),
      sector: raw.sector || raw.industry || '',
      raw: raw
    };
  }
};

// ====================
// Initialization
// ====================
async function init() {
  // Load balance from localStorage
  const savedBalance = localStorage.getItem('stockquest_balance');
  if (savedBalance) {
    state.balance = parseFloat(savedBalance);
  }
  updateBalanceDisplay();

  // Load stocks
  await loadStocks();

  // Listen for Auth Changes
  document.addEventListener('authStateChanged', async (e) => {
    state.user = e.detail;
    if (state.user) {
      if (window.Database) {
        try {
          const userDoc = await Database.getUser(state.user.uid);
          if (userDoc) {
            state.balance = userDoc.balance !== undefined ? userDoc.balance : 1000000;
            updateBalanceDisplay();
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }
      updateUserUI();
    }
  });
}

function updateUserUI() {
  const avatar = document.getElementById('userAvatar');
  if (state.user && avatar) {
    const name = state.user.displayName || state.user.email || 'U';
    avatar.textContent = name.charAt(0).toUpperCase();
  }
}

function updateBalanceDisplay() {
  const balanceEl = document.getElementById('userBalance');
  if (balanceEl) {
    balanceEl.textContent = utils.formatCurrency(state.balance);
  }
}

// ====================
// Stock Loading (via Flask API)
// ====================
async function loadStocks() {
  const grid = document.getElementById('stockGrid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="loading" style="grid-column: 1/-1;">
      <div class="spinner"></div>
      <span>Loading stocks...</span>
    </div>
  `;

  try {
    const result = await api.get('/trending');

    if (result.success && result.data) {
      let stocks = [];

      // Handle various API response structures
      if (Array.isArray(result.data)) {
        stocks = result.data;
      } else if (result.data.trending_stocks) {
        const ts = result.data.trending_stocks;
        stocks = [...(ts.top_gainers || []), ...(ts.top_losers || [])];
      } else if (result.data.topGainers || result.data.top_gainers) {
        stocks = [
          ...(result.data.topGainers || result.data.top_gainers || []),
          ...(result.data.topLosers || result.data.top_losers || [])
        ];
      }

      state.stocks = stocks.map(s => utils.parseStock(s)).filter(s => s && s.name !== 'Unknown');
      state.filteredStocks = [...state.stocks];
      renderStocks();
    } else {
      showEmptyState('Failed to load stocks. Please try again.');
    }
  } catch (error) {
    console.error('Error loading stocks:', error);
    showEmptyState('Network error. Please check your connection.');
  }
}

function showEmptyState(message) {
  const grid = document.getElementById('stockGrid');
  if (grid) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
        </div>
        <p class="empty-state-title">No Stocks Available</p>
        <p class="empty-state-desc">${message}</p>
        <button class="btn btn-primary mt-4" onclick="loadStocks()">Retry</button>
      </div>
    `;
  }
}

// ====================
// Rendering
// ====================
function renderStocks() {
  const grid = document.getElementById('stockGrid');
  if (!grid) return;

  if (state.filteredStocks.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <p class="empty-state-title">No stocks found</p>
        <p class="empty-state-desc">Try a different search term or press Enter to search all</p>
        <button class="btn btn-primary mt-4" onclick="searchAll()">Search All Stocks</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = state.filteredStocks.map(stock => createStockCard(stock)).join('');
  updateSelectedCount();
}

function createStockCard(stock) {
  const isSelected = state.selectedStocks.some(s => s.symbol === stock.symbol);
  const isCaptain = state.captain === stock.symbol;
  const isVC = state.viceCaptain === stock.symbol;
  const changeClass = utils.getChangeClass(stock.change);

  return `
    <div class="stock-card ${isSelected ? 'selected' : ''}" 
         data-symbol="${stock.symbol}"
         onclick="showStockDetail('${stock.symbol}')">
      <div class="stock-header">
        <div>
          <div class="stock-name">${stock.name}</div>
          <div class="stock-symbol">${stock.symbol}</div>
        </div>
        <div class="stock-change ${changeClass}">
          ${stock.change >= 0 ? '↑' : '↓'} ${utils.formatPercent(stock.change)}
        </div>
      </div>
      
      <div class="stock-price">${utils.formatCurrency(stock.price)}</div>
      
      <div class="stock-stats">
        <div class="stock-stat">
          <div class="stock-stat-label">Vol</div>
          <div class="stock-stat-value">${utils.formatNumber(stock.volume)}</div>
        </div>
        <div class="stock-stat">
          <div class="stock-stat-label">High</div>
          <div class="stock-stat-value">${utils.formatCurrency(stock.high || stock.price * 1.02)}</div>
        </div>
        <div class="stock-stat">
          <div class="stock-stat-label">Low</div>
          <div class="stock-stat-value">${utils.formatCurrency(stock.low || stock.price * 0.98)}</div>
        </div>
      </div>
      
      <div class="flex gap-2 mt-4">
        <button class="btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-sm" style="flex: 1;"
                onclick="event.stopPropagation(); toggleStock('${stock.symbol}')">
          ${isSelected ? 'Selected' : 'Add'}
        </button>
        <a href="/stock-detail.html?name=${encodeURIComponent(stock.name)}" 
           class="btn btn-icon" style="width: 36px; height: 36px;" 
           onclick="event.stopPropagation();" title="View Profile">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
        ${isCaptain ? '<span class="badge" style="background: var(--warning); color: #000; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">C</span>' : ''}
        ${isVC ? '<span class="badge" style="background: var(--accent); color: #000; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">VC</span>' : ''}
      </div>
    </div>
  `;
}

function renderTeamList() {
  const list = document.getElementById('teamList');
  const multiplierInfo = document.getElementById('multiplierInfo');
  const btn = document.getElementById('createPortfolioBtn');

  if (!list) return;

  if (state.selectedStocks.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="padding: 40px 20px;">
        <div class="empty-state-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </div>
        <p class="empty-state-title">No stocks selected</p>
        <p class="empty-state-desc">Click on stocks to add them to your team</p>
      </div>
    `;
    if (multiplierInfo) multiplierInfo.style.display = 'none';
    if (btn) btn.disabled = true;
  } else {
    list.innerHTML = state.selectedStocks.map(stock => {
      const isCaptain = state.captain === stock.symbol;
      const isVC = state.viceCaptain === stock.symbol;

      return `
        <div class="team-stock-item flex justify-between items-center" style="padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: 8px;">
          <div>
            <div style="font-weight: 500;">${stock.name}</div>
            <div class="text-muted" style="font-size: 0.8rem;">${utils.formatCurrency(stock.price)} × 10</div>
          </div>
          <div class="flex gap-1">
            ${isCaptain ? '<span style="background: var(--warning); color: #000; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">C</span>' : ''}
            ${isVC ? '<span style="background: var(--accent); color: #000; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">VC</span>' : ''}
            <button class="btn-icon" style="width: 24px; height: 24px;" onclick="removeStock('${stock.symbol}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (multiplierInfo) {
      multiplierInfo.style.display = state.selectedStocks.length >= 2 ? 'block' : 'none';
    }

    if (btn) {
      const canCreate = state.selectedStocks.length >= state.minStocks && state.captain && state.viceCaptain;
      btn.disabled = !canCreate;
    }
  }

  updateInvestmentProgress();
  updateSelectedCount();
}

function updateInvestmentProgress() {
  const totalInvested = state.selectedStocks.reduce((sum, s) => sum + (s.price * 10), 0);
  const progress = Math.min((totalInvested / state.balance) * 100, 100);

  const investedEl = document.getElementById('totalInvested');
  const progressEl = document.getElementById('investmentProgress');
  const minReqEl = document.getElementById('minRequired');

  if (investedEl) investedEl.textContent = utils.formatCurrency(totalInvested);
  if (progressEl) progressEl.style.width = `${progress}%`;

  if (minReqEl) {
    const remaining = state.minStocks - state.selectedStocks.length;
    if (remaining > 0) {
      minReqEl.textContent = `Select ${remaining} more stock${remaining > 1 ? 's' : ''}`;
    } else if (!state.captain || !state.viceCaptain) {
      minReqEl.textContent = 'Select Captain & Vice Captain';
    } else {
      minReqEl.textContent = 'Ready to create portfolio';
      minReqEl.style.color = 'var(--accent)';
    }
  }
}

function updateSelectedCount() {
  const countEl = document.getElementById('selectedCount');
  if (countEl) countEl.textContent = state.selectedStocks.length;
}

// ====================
// Stock Actions
// ====================
function toggleStock(symbol) {
  const stock = state.stocks.find(s => s.symbol === symbol) ||
    state.filteredStocks.find(s => s.symbol === symbol);
  if (!stock) return;

  const index = state.selectedStocks.findIndex(s => s.symbol === symbol);

  if (index > -1) {
    removeStock(symbol);
  } else {
    addStock(symbol);
  }
}

function addStock(symbol) {
  const stock = state.stocks.find(s => s.symbol === symbol) ||
    state.filteredStocks.find(s => s.symbol === symbol);
  if (!stock) return;

  if (state.selectedStocks.length >= state.maxStocks) {
    showToast(`Maximum ${state.maxStocks} stocks allowed`, 'error');
    return;
  }

  if (state.selectedStocks.some(s => s.symbol === symbol)) {
    showToast('Stock already selected', 'error');
    return;
  }

  state.selectedStocks.push(stock);
  showToast(`${stock.name} added`, 'success');
  renderTeamList();
  renderStocks();
}

function removeStock(symbol) {
  const index = state.selectedStocks.findIndex(s => s.symbol === symbol);
  if (index > -1) {
    const stock = state.selectedStocks[index];
    state.selectedStocks.splice(index, 1);

    if (state.captain === symbol) state.captain = null;
    if (state.viceCaptain === symbol) state.viceCaptain = null;

    showToast(`${stock.name} removed`, 'info');
    renderTeamList();
    renderStocks();
  }
}

function clearTeam() {
  state.selectedStocks = [];
  state.captain = null;
  state.viceCaptain = null;
  showToast('Team cleared', 'info');
  renderTeamList();
  renderStocks();
}

function selectCaptain() {
  if (state.selectedStocks.length < 1) {
    showToast('Add stocks first', 'error');
    return;
  }
  const available = state.selectedStocks.find(s => s.symbol !== state.viceCaptain);
  if (available) {
    state.captain = available.symbol;
    showToast(`${available.name} is now Captain`, 'success');
    renderTeamList();
    renderStocks();
  }
}

function selectViceCaptain() {
  if (state.selectedStocks.length < 2) {
    showToast('Add at least 2 stocks', 'error');
    return;
  }
  const available = state.selectedStocks.find(s => s.symbol !== state.captain);
  if (available) {
    state.viceCaptain = available.symbol;
    showToast(`${available.name} is now Vice Captain`, 'success');
    renderTeamList();
    renderStocks();
  }
}

// ====================
// Search & Filter
// ====================
let searchTimeout = null;

function handleSearch(event) {
  state.searchQuery = event.target.value.toLowerCase().trim();

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    applyFilters();
  }, 300);
}

async function handleSearchKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    await searchAll();
  }
}

async function searchAll() {
  const query = document.getElementById('stockSearch').value.trim();
  if (query.length < 2) return;

  const grid = document.getElementById('stockGrid');
  grid.innerHTML = `
    <div class="loading" style="grid-column: 1/-1;">
      <div class="spinner"></div>
      <span>Searching for "${query}"...</span>
    </div>
  `;

  try {
    const result = await api.get('/stock', { name: query });

    if (result.success && result.data) {
      const stock = utils.parseStock(result.data);
      if (stock && stock.name !== 'Unknown') {
        const exists = state.stocks.find(s => s.symbol === stock.symbol);
        if (!exists) {
          state.stocks.unshift(stock);
        }
        state.filteredStocks = [stock];
        renderStocks();
        showToast(`Found: ${stock.name}`, 'success');
      } else {
        showEmptyState(`No results for "${query}"`);
      }
    } else {
      showEmptyState(`No results for "${query}"`);
    }
  } catch (error) {
    showToast('Search failed', 'error');
    renderStocks();
  }
}

function setFilter(filter) {
  state.filter = filter;
  document.querySelectorAll('.pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  applyFilters();
}

function applyFilters() {
  let filtered = [...state.stocks];

  if (state.searchQuery) {
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(state.searchQuery) ||
      s.symbol.toLowerCase().includes(state.searchQuery)
    );
  }

  if (state.filter === 'gainers') {
    filtered = filtered.filter(s => s.change > 0);
  } else if (state.filter === 'losers') {
    filtered = filtered.filter(s => s.change < 0);
  }

  state.filteredStocks = filtered;
  renderStocks();
}

// ====================
// Stock Modal
// ====================
async function showStockDetail(symbol) {
  const stock = state.stocks.find(s => s.symbol === symbol) ||
    state.filteredStocks.find(s => s.symbol === symbol);
  if (!stock) return;

  // Show modal with loading state
  document.getElementById('modalStockName').textContent = stock.name;
  document.getElementById('modalSymbol').textContent = stock.symbol;
  document.getElementById('modalPrice').textContent = utils.formatCurrency(stock.price);

  const changeClass = utils.getChangeClass(stock.change);
  const changeEl = document.getElementById('modalChange');
  changeEl.textContent = `${stock.change >= 0 ? '↑' : '↓'} ${utils.formatPercent(stock.change)}`;
  changeEl.className = `stock-change ${changeClass}`;

  // Show loading for detailed data
  document.getElementById('modalMarketCap').textContent = 'Loading...';
  document.getElementById('modalPE').textContent = 'Loading...';
  document.getElementById('modal52High').textContent = 'Loading...';
  document.getElementById('modal52Low').textContent = 'Loading...';
  document.getElementById('modalVolume').textContent = utils.formatNumber(stock.volume) || 'Loading...';
  document.getElementById('modalSector').textContent = 'Loading...';

  const addBtn = document.getElementById('modalAddBtn');
  const isSelected = state.selectedStocks.some(s => s.symbol === symbol);
  addBtn.textContent = isSelected ? 'Remove' : 'Add to Team';
  addBtn.className = isSelected ? 'btn btn-secondary' : 'btn btn-primary';

  document.getElementById('stockModal').classList.add('active');

  // Fetch detailed stock data from API
  try {
    const result = await api.get('/stock', { name: stock.name });
    console.log('Stock API Response:', result);  // Debug log

    if (result.success && result.data) {
      let detailed = result.data;

      // Handle nested response structures (API may wrap data)
      if (detailed.stock) detailed = detailed.stock;
      if (detailed.data) detailed = detailed.data;
      if (detailed.result) detailed = detailed.result;

      console.log('Parsed stock data:', detailed);  // Debug log

      // Parse numeric values with many field name variations
      const parseNum = (val) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        if (typeof val === 'object') {
          return parseFloat(val.value || val.raw || val.amount || val.price || val.ltp || 0);
        }
        const str = String(val).replace(/[₹,%+\s,Cr]/gi, '').trim();
        if (str.toLowerCase().includes('cr')) {
          return parseFloat(str.replace(/cr/i, '')) * 10000000;
        }
        if (str.toLowerCase().includes('l')) {
          return parseFloat(str.replace(/l/i, '')) * 100000;
        }
        return parseFloat(str) || 0;
      };

      // Extract data with many field name variations
      // Check companyProfile for business data
      const profile = detailed.companyProfile || {};

      const marketCap = parseNum(
        detailed.marketCap || detailed.market_cap || detailed.mcap ||
        profile.marketCap || profile.market_cap || profile.mCap ||
        detailed.mktCap || detailed.market_capitalization || detailed.m_cap ||
        (detailed.key_metrics && detailed.key_metrics.market_cap)
      );
      const pe = parseNum(
        detailed.pe || detailed.peRatio || detailed.PE || detailed.p_e ||
        profile.pe || profile.peRatio || profile.priceToEarnings ||
        detailed.priceToEarnings || detailed.price_earnings || detailed.pe_ratio ||
        (detailed.key_metrics && detailed.key_metrics.pe)
      );
      const high52 = parseNum(
        detailed.high52 || detailed.week52High || detailed['52WeekHigh'] ||
        detailed.yearHigh || detailed['52_week_high'] || detailed.fiftyTwoWeekHigh
      );
      const low52 = parseNum(
        detailed.low52 || detailed.week52Low || detailed['52WeekLow'] ||
        detailed.yearLow || detailed['52_week_low'] || detailed.fiftyTwoWeekLow
      );
      const volume = parseNum(
        detailed.volume || detailed.tradedVolume || detailed.totalTradedVolume ||
        detailed.volumeTraded || detailed.traded_volume || stock.volume
      );
      const sector = detailed.sector || detailed.industry || detailed.sector_name ||
        detailed.industryName || detailed.category || '';

      document.getElementById('modalMarketCap').textContent = marketCap ? utils.formatCurrency(marketCap) : '--';
      document.getElementById('modalPE').textContent = pe ? pe.toFixed(2) : '--';
      document.getElementById('modal52High').textContent = high52 ? utils.formatCurrency(high52) : '--';
      document.getElementById('modal52Low').textContent = low52 ? utils.formatCurrency(low52) : '--';
      document.getElementById('modalVolume').textContent = volume ? utils.formatNumber(volume) : '--';
      document.getElementById('modalSector').textContent = sector || '--';

      // Update current stock with detailed data
      state.currentStock = {
        ...stock,
        marketCap: marketCap || stock.marketCap,
        pe: pe || stock.pe,
        high52: high52 || stock.high52,
        low52: low52 || stock.low52,
        volume: volume || stock.volume,
        sector: sector || stock.sector
      };
    } else {
      // API didn't return data, show dashes
      document.getElementById('modalMarketCap').textContent = '--';
      document.getElementById('modalPE').textContent = '--';
      document.getElementById('modal52High').textContent = '--';
      document.getElementById('modal52Low').textContent = '--';
      document.getElementById('modalSector').textContent = '--';
      state.currentStock = stock;
    }
  } catch (error) {
    console.error('Error fetching stock details:', error);
    document.getElementById('modalMarketCap').textContent = '--';
    document.getElementById('modalPE').textContent = '--';
    document.getElementById('modal52High').textContent = '--';
    document.getElementById('modal52Low').textContent = '--';
    document.getElementById('modalSector').textContent = '--';
    state.currentStock = stock;
  }
}

function closeStockModal() {
  document.getElementById('stockModal').classList.remove('active');
  state.currentStock = null;
}

function closeModal(event) {
  if (event.target === event.currentTarget) {
    closeStockModal();
  }
}

function addStockFromModal() {
  if (state.currentStock) {
    toggleStock(state.currentStock.symbol);

    const addBtn = document.getElementById('modalAddBtn');
    const isSelected = state.selectedStocks.some(s => s.symbol === state.currentStock.symbol);
    addBtn.textContent = isSelected ? 'Remove' : 'Add to Team';
    addBtn.className = isSelected ? 'btn btn-secondary' : 'btn btn-primary';
  }
}

// ====================
// Portfolio Creation
// ====================
async function createPortfolio() {
  if (state.selectedStocks.length < state.minStocks) {
    showToast(`Select at least ${state.minStocks} stocks`, 'error');
    return;
  }

  if (!state.captain) {
    showToast('Please select a Captain', 'error');
    return;
  }

  if (!state.viceCaptain) {
    showToast('Please select a Vice Captain', 'error');
    return;
  }

  const totalCost = state.selectedStocks.reduce((sum, s) => sum + (s.price * 10), 0);

  if (totalCost > state.balance) {
    showToast('Insufficient balance', 'error');
    return;
  }

  const portfolioData = {
    stocks: state.selectedStocks.map(s => ({
      symbol: s.symbol,
      name: s.name,
      price: s.price,
      quantity: 10
    })),
    captain: state.captain,
    viceCaptain: state.viceCaptain,
    invested: totalCost
  };

  // Save to Firestore
  if (state.user && window.Database) {
    try {
      // Create portfolio doc
      await Database.createPortfolio(state.user.uid, portfolioData);

      // Update user balance
      state.balance -= totalCost;
      await Database.updateUser(state.user.uid, { balance: state.balance });

      // Update Leaderboard Entry (initialize points if needed)
      await Database.updateLeaderboardEntry(state.user.uid, {
        name: state.user.displayName,
        points: 0 // New portfolio starts at 0 or accumulates? For now 0.
        // If user already has points, this might reset them? 
        // Ideally we shouldn't reset points. Database.updateLeaderboardEntry uses {merge: true}
      });

    } catch (error) {
      console.error("Firestore Error:", error);
      showToast('Failed to save to cloud: ' + error.message, 'error');
      return;
    }
  } else {
    // Fallback (or Error if auth required)
    showToast('You must be logged in', 'error');
    // Redirect handled by auth listener usually
    return;
  }

  // Local state update for UI
  updateBalanceDisplay();
  showToast('Portfolio created successfully!', 'success');

  // Clear selection
  state.selectedStocks = [];
  state.captain = null;
  state.viceCaptain = null;
  renderTeamList();
  renderStocks();

  // Redirect to portfolio page
  setTimeout(() => {
    window.location.href = 'portfolio.html';
  }, 1500);
}

// ====================
// Toast Notifications
// ====================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success' ? '<path d="M20 6L9 17l-5-5"/>' :
      type === 'error' ? '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>' :
        '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'}
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ====================
// User Menu
// ====================
function toggleUserMenu() {
  if (typeof Auth !== 'undefined' && state.user) {
    if (confirm('Sign out?')) {
      Auth.signOut();
      window.location.href = 'login.html';
    }
  } else {
    window.location.href = 'login.html';
  }
}

// ====================
// Theme Management
// ====================
function initTheme() {
  const root = document.documentElement;
  const storedTheme = localStorage.getItem('stockquest_theme') || 'dark';
  root.setAttribute('data-theme', storedTheme);

  const toggleBtn = document.getElementById('navThemeToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('stockquest_theme', next);
    });
  }
}

// ====================
// Initialize on Load
// ====================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  init();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeStockModal();
  }
});
