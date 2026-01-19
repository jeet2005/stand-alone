/**
 * StockQuest - Fantasy Stock Market Game
 * Complete JavaScript with proper data handling
 */

// ====================
// State Management
// ====================
const state = {
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
// API Service
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
        if (!amount || isNaN(amount)) return '₹0.00';
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
        const num = parseFloat(String(value).replace('%', '').replace('+', ''));
        if (isNaN(num)) return '0.00%';
        const sign = num >= 0 ? '+' : '';
        return `${sign}${num.toFixed(2)}%`;
    },

    parsePrice(priceData) {
        // Handle various price formats from API
        if (!priceData) return 0;

        // If it's already a number
        if (typeof priceData === 'number') return priceData;

        // If it's an object, try common fields
        if (typeof priceData === 'object') {
            return parseFloat(priceData.value || priceData.price || priceData.ltp || 0);
        }

        // If it's a string, clean and parse
        return parseFloat(String(priceData).replace(/[₹,\s]/g, '')) || 0;
    },

    parseChange(changeData) {
        if (!changeData) return 0;
        if (typeof changeData === 'number') return changeData;
        if (typeof changeData === 'object') {
            return parseFloat(changeData.value || changeData.percent || changeData.pChange || 0);
        }
        return parseFloat(String(changeData).replace(/[%+\s]/g, '')) || 0;
    },

    extractStockData(rawStock) {
        // Normalize stock data from various API formats
        const name = rawStock.company_name || rawStock.companyName || rawStock.name ||
            rawStock.longName || rawStock.shortName || rawStock.symbol || 'Unknown';

        const symbol = rawStock.symbol || rawStock.ticker || rawStock.nseSymbol ||
            rawStock.bseSymbol || rawStock.stock_id ||
            (name.substring(0, 6).toUpperCase().replace(/\s/g, ''));

        const price = utils.parsePrice(rawStock.currentPrice || rawStock.current_price ||
            rawStock.price || rawStock.ltp || rawStock.lastPrice ||
            rawStock.close || rawStock.previousClose || 0);

        const change = utils.parseChange(rawStock.pChange || rawStock.change_percent ||
            rawStock.changePercent || rawStock.percent_change ||
            rawStock.change || 0);

        const changeAbs = utils.parsePrice(rawStock.change || rawStock.priceChange ||
            rawStock.dayChange || 0);

        const volume = rawStock.volume || rawStock.tradedVolume || rawStock.totalTradedVolume ||
            rawStock.traded_volume || 0;

        const high = utils.parsePrice(rawStock.high || rawStock.dayHigh || rawStock.high52 || 0);
        const low = utils.parsePrice(rawStock.low || rawStock.dayLow || rawStock.low52 || 0);

        return {
            id: symbol + '_' + Date.now(),
            name: name,
            symbol: symbol,
            price: price,
            change: change,
            changeAbs: changeAbs,
            volume: volume,
            high: high,
            low: low,
            sector: rawStock.sector || rawStock.industry || rawStock.sector_name || '',
            marketCap: rawStock.marketCap || rawStock.market_cap || rawStock.mcap || 0,
            pe: rawStock.pe || rawStock.peRatio || rawStock.pe_ratio || 0,
            high52: rawStock.high52 || rawStock.week52High || rawStock.yearHigh || 0,
            low52: rawStock.low52 || rawStock.week52Low || rawStock.yearLow || 0,
            raw: rawStock
        };
    },

    getChangeClass(change) {
        return change >= 0 ? 'positive' : 'negative';
    },

    generateStockId() {
        return 'S' + String(Math.floor(Math.random() * 9999999)).padStart(7, '0');
    }
};

// ====================
// Data Loading
// ====================
async function loadStocks() {
    const grid = document.getElementById('stockGrid');
    if (!grid) return;

    grid.innerHTML = `
    <div class="loading-placeholder">
      <div class="spinner"></div>
      <p>Loading stocks...</p>
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
            } else if (result.data.trendingStocks) {
                stocks = result.data.trendingStocks;
            } else if (result.data.topGainers || result.data.top_gainers) {
                stocks = [
                    ...(result.data.topGainers || result.data.top_gainers || []),
                    ...(result.data.topLosers || result.data.top_losers || [])
                ];
            }

            // Normalize all stock data
            state.stocks = stocks.map(s => utils.extractStockData(s));
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
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-title">No Stocks Available</div>
        <p class="empty-state-description">${message}</p>
        <button class="btn btn-primary" onclick="loadStocks()">Retry</button>
      </div>
    `;
    }
}

// ====================
// Rendering Functions
// ====================
function renderStocks() {
    const grid = document.getElementById('stockGrid');
    if (!grid) return;

    if (state.filteredStocks.length === 0) {
        showEmptyState('No stocks match your filter criteria.');
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
    <div class="sq-stock-card ${isSelected ? 'selected' : ''}" 
         data-symbol="${stock.symbol}"
         onclick="showStockDetail('${stock.symbol}')">
      <div class="stock-card-top">
        <div class="stock-name-section">
          <div class="stock-name">${stock.name}</div>
          <div class="stock-id">${stock.symbol}</div>
        </div>
        <div class="stock-change-badge ${changeClass}">
          ${changeClass === 'positive' ? '↗' : '↘'} ${utils.formatPercent(stock.change)}
        </div>
      </div>
      
      <div class="stock-price-row">
        <span class="stock-price-main">${utils.formatCurrency(stock.price)}</span>
        <span class="stock-price-change ${changeClass}">
          ${stock.changeAbs >= 0 ? '+' : ''}${utils.formatCurrency(Math.abs(stock.changeAbs || stock.price * stock.change / 100))}
        </span>
      </div>
      
      <div class="stock-stats-row">
        <div class="stock-stat">
          <div class="stock-stat-label">Volume</div>
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
      
      <div class="stock-action-row">
        <button class="btn-add-stock ${isSelected ? 'selected' : ''}" 
                onclick="event.stopPropagation(); toggleStock('${stock.symbol}')">
          ${isSelected ? '✓ Selected' : '+ Add Stock'}
        </button>
        <button class="btn-stock-icon" onclick="event.stopPropagation(); showStockDetail('${stock.symbol}')" title="Details">
          📊
        </button>
        <button class="btn-stock-icon" onclick="event.stopPropagation(); toggleFavorite('${stock.symbol}')" title="Favorite">
          ⭐
        </button>
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
      <div class="empty-team">
        <span class="empty-icon">👆</span>
        <p>Click on stocks to add them to your team</p>
      </div>
    `;
        if (multiplierInfo) multiplierInfo.style.display = 'none';
        if (btn) btn.disabled = true;
    } else {
        list.innerHTML = state.selectedStocks.map(stock => {
            const isCaptain = state.captain === stock.symbol;
            const isVC = state.viceCaptain === stock.symbol;

            return `
        <div class="team-stock-item ${isCaptain ? 'captain' : ''} ${isVC ? 'vc' : ''}">
          <div class="team-stock-info">
            <div class="team-stock-name">${stock.name}</div>
            <div class="team-stock-price">${utils.formatCurrency(stock.price)} × 10 shares</div>
          </div>
          <div class="team-stock-actions">
            <button class="team-action-btn captain-btn ${isCaptain ? 'active' : ''}" 
                    onclick="setCaptain('${stock.symbol}')" title="Captain (2x)">👑</button>
            <button class="team-action-btn vc-btn ${isVC ? 'active' : ''}" 
                    onclick="setViceCaptain('${stock.symbol}')" title="Vice Captain (1.5x)">⭐</button>
            <button class="team-action-btn remove-btn" 
                    onclick="removeStock('${stock.symbol}')" title="Remove">✕</button>
          </div>
        </div>
      `;
        }).join('');

        if (multiplierInfo) {
            multiplierInfo.style.display = state.selectedStocks.length >= 2 ? 'block' : 'none';
        }

        // Enable button if minimum stocks selected and captain/VC set
        if (btn) {
            const canCreate = state.selectedStocks.length >= state.minStocks &&
                state.captain && state.viceCaptain;
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
            minReqEl.innerHTML = `⚠️ ${remaining} more stock${remaining > 1 ? 's' : ''} needed`;
        } else if (!state.captain || !state.viceCaptain) {
            minReqEl.innerHTML = `⚠️ Select Captain & VC`;
        } else {
            minReqEl.innerHTML = `✓ Ready to create`;
            minReqEl.classList.remove('warning');
            minReqEl.style.color = '#22c55e';
        }
    }
}

function updateSelectedCount() {
    const countEl = document.getElementById('selectedCount');
    const teamCountEl = document.getElementById('teamCount');

    if (countEl) countEl.textContent = state.selectedStocks.length;
    if (teamCountEl) teamCountEl.textContent = state.selectedStocks.length;
}

// ====================
// Stock Actions
// ====================
function toggleStock(symbol) {
    const stock = state.stocks.find(s => s.symbol === symbol);
    if (!stock) return;

    const index = state.selectedStocks.findIndex(s => s.symbol === symbol);

    if (index > -1) {
        removeStock(symbol);
    } else {
        addStock(symbol);
    }
}

function addStock(symbol) {
    const stock = state.stocks.find(s => s.symbol === symbol);
    if (!stock) return;

    if (state.selectedStocks.length >= state.maxStocks) {
        showToast(`Maximum ${state.maxStocks} stocks allowed`, 'error');
        return;
    }

    if (state.selectedStocks.some(s => s.symbol === symbol)) {
        showToast('Stock already in team', 'error');
        return;
    }

    state.selectedStocks.push(stock);
    showToast(`${stock.name} added to team`, 'success');
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

        showToast(`${stock.name} removed from team`, 'info');
        renderTeamList();
        renderStocks();
    }
}

function setCaptain(symbol) {
    if (state.viceCaptain === symbol) {
        state.viceCaptain = null;
    }
    state.captain = symbol;
    showToast('Captain selected! (2x points)', 'success');
    renderTeamList();
}

function setViceCaptain(symbol) {
    if (state.captain === symbol) {
        showToast('Captain cannot be Vice Captain', 'error');
        return;
    }
    state.viceCaptain = symbol;
    showToast('Vice Captain selected! (1.5x points)', 'success');
    renderTeamList();
}

function clearTeam() {
    state.selectedStocks = [];
    state.captain = null;
    state.viceCaptain = null;
    showToast('Team cleared', 'info');
    renderTeamList();
    renderStocks();
}

// ====================
// Filter & Search
// ====================
let searchTimeout = null;

function setFilter(filter) {
    state.filter = filter;

    // Update UI
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === filter);
    });

    applyFilters();
}

function filterStocks() {
    const input = document.getElementById('stockSearch');
    state.searchQuery = input.value.toLowerCase().trim();

    // Debounce the search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        applyFilters();
    }, 300);
}

// Handle Enter key for direct API search
async function handleSearchKeydown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const query = document.getElementById('stockSearch').value.trim();
        if (query.length >= 2) {
            await searchStockByName(query);
        }
    }
}

// Search stock directly by name via API
async function searchStockByName(query) {
    const grid = document.getElementById('stockGrid');
    grid.innerHTML = `
    <div class="loading-placeholder">
      <div class="spinner"></div>
      <p>Searching for "${query}"...</p>
    </div>
  `;

    try {
        // Try to get stock details directly
        const result = await api.get('/stock', { name: query });

        if (result.success && result.data) {
            const stockData = result.data;
            const stock = utils.extractStockData(stockData);

            // Add to stocks if not already present
            const existingIndex = state.stocks.findIndex(s =>
                s.symbol.toLowerCase() === stock.symbol.toLowerCase() ||
                s.name.toLowerCase() === stock.name.toLowerCase()
            );

            if (existingIndex === -1) {
                state.stocks.unshift(stock);
            }

            state.filteredStocks = [stock];
            renderStocks();
            showToast(`Found: ${stock.name}`, 'success');
        } else {
            // Try industry search as fallback
            const industryResult = await api.get('/industry_search', { query: query });

            if (industryResult.success && industryResult.data) {
                let items = [];
                if (Array.isArray(industryResult.data)) {
                    items = industryResult.data;
                } else if (industryResult.data.stocks) {
                    items = industryResult.data.stocks;
                } else if (industryResult.data.results) {
                    items = industryResult.data.results;
                }

                if (items.length > 0) {
                    const newStocks = items.map(s => utils.extractStockData(s));
                    state.filteredStocks = newStocks;
                    renderStocks();
                    showToast(`Found ${items.length} result(s)`, 'success');
                } else {
                    showEmptyState(`No stocks found for "${query}". Try a different search term.`);
                }
            } else {
                showEmptyState(`No stocks found for "${query}". Try a different search term.`);
            }
        }
    } catch (error) {
        console.error('Search error:', error);
        showEmptyState('Search failed. Please try again.');
    }
}

function applyFilters() {
    let filtered = [...state.stocks];

    // Apply search
    if (state.searchQuery) {
        filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(state.searchQuery) ||
            s.symbol.toLowerCase().includes(state.searchQuery)
        );

        // If no local results, show hint to press Enter for API search
        if (filtered.length === 0 && state.searchQuery.length >= 2) {
            const grid = document.getElementById('stockGrid');
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-title">No local matches for "${state.searchQuery}"</div>
                    <p class="empty-state-description">Press <kbd>Enter</kbd> to search the full database, or clear the search to see trending stocks.</p>
                    <button class="btn btn-primary" onclick="searchStockByName('${state.searchQuery}')">Search All Stocks</button>
                </div>
            `;
            return;
        }
    }

    // Apply filter
    if (state.filter === 'gainers') {
        filtered = filtered.filter(s => s.change > 0);
    } else if (state.filter === 'losers') {
        filtered = filtered.filter(s => s.change < 0);
    }

    state.filteredStocks = filtered;
    renderStocks();
}

// ====================
// Stock Detail Modal
// ====================
function showStockDetail(symbol) {
    const stock = state.stocks.find(s => s.symbol === symbol);
    if (!stock) return;

    state.currentStock = stock;
    const changeClass = utils.getChangeClass(stock.change);

    document.getElementById('modalStockName').textContent = stock.name;
    document.getElementById('modalSymbol').textContent = stock.symbol;
    document.getElementById('modalPrice').textContent = utils.formatCurrency(stock.price);

    const changeEl = document.getElementById('modalChange');
    changeEl.textContent = `${stock.change >= 0 ? '▲' : '▼'} ${utils.formatPercent(stock.change)}`;
    changeEl.className = `modal-change ${changeClass}`;

    document.getElementById('modalMarketCap').textContent = stock.marketCap ? utils.formatCurrency(stock.marketCap) : '-';
    document.getElementById('modalPE').textContent = stock.pe ? stock.pe.toFixed(2) : '-';
    document.getElementById('modal52High').textContent = stock.high52 ? utils.formatCurrency(stock.high52) : '-';
    document.getElementById('modal52Low').textContent = stock.low52 ? utils.formatCurrency(stock.low52) : '-';
    document.getElementById('modalVolume').textContent = stock.volume ? utils.formatNumber(stock.volume) : '0';
    document.getElementById('modalSector').textContent = stock.sector || '-';

    // Update add button
    const addBtn = document.getElementById('modalAddBtn');
    const isSelected = state.selectedStocks.some(s => s.symbol === symbol);
    addBtn.textContent = isSelected ? 'Remove from Team' : 'Add to Team';
    addBtn.className = isSelected ? 'btn btn-secondary' : 'btn btn-primary';

    document.getElementById('stockModal').classList.add('active');
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

        // Update button state
        const addBtn = document.getElementById('modalAddBtn');
        const isSelected = state.selectedStocks.some(s => s.symbol === state.currentStock.symbol);
        addBtn.textContent = isSelected ? 'Remove from Team' : 'Add to Team';
        addBtn.className = isSelected ? 'btn btn-secondary' : 'btn btn-primary';
    }
}

function toggleFavorite(symbol) {
    showToast('Added to watchlist', 'success');
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

    // Save portfolio
    const portfolio = {
        id: 'P' + Date.now(),
        stocks: state.selectedStocks.map(s => ({
            symbol: s.symbol,
            name: s.name,
            price: s.price,
            quantity: 10
        })),
        captain: state.captain,
        viceCaptain: state.viceCaptain,
        invested: totalCost,
        createdAt: new Date().toISOString()
    };

    // Store in localStorage
    const portfolios = JSON.parse(localStorage.getItem('stockquest_portfolios') || '[]');
    portfolios.push(portfolio);
    localStorage.setItem('stockquest_portfolios', JSON.stringify(portfolios));

    // Update balance
    state.balance -= totalCost;
    localStorage.setItem('stockquest_balance', state.balance);
    updateBalanceDisplay();

    showToast('Portfolio created successfully!', 'success');

    // Clear selection
    state.selectedStocks = [];
    state.captain = null;
    state.viceCaptain = null;
    renderTeamList();
    renderStocks();

    // Redirect to portfolio page after delay
    setTimeout(() => {
        window.location.href = '/portfolio.html';
    }, 1500);
}

// ====================
// Balance & User
// ====================
function updateBalanceDisplay() {
    const balanceEl = document.getElementById('userBalance');
    if (balanceEl) {
        balanceEl.textContent = utils.formatCurrency(state.balance);
    }
}

function loadUserData() {
    const savedBalance = localStorage.getItem('stockquest_balance');
    if (savedBalance) {
        state.balance = parseFloat(savedBalance);
    }
    updateBalanceDisplay();
}

// ====================
// Toast Notifications
// ====================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ====================
// Refresh & Init
// ====================
function refreshData() {
    loadStocks();
    showToast('Refreshing data...', 'info');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    loadStocks();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeStockModal();
        }
    });
});
