/**
 * Dashboard Page JavaScript
 * Loads IPO, News, Commodities, Mutual Funds, Price Shockers
 */

// State
let state = {
    balance: 1000000,
    currentExchange: 'nse'
};

// API Helper
const api = {
    async get(endpoint) {
        try {
            const response = await fetch('/api' + endpoint);
            return await response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            return { success: false, error: error.message };
        }
    }
};

// Utility functions
const utils = {
    formatCurrency(amount) {
        if (!amount || isNaN(amount)) return '₹0.00';
        const num = parseFloat(String(amount).replace(/[₹,\s]/g, ''));
        if (num >= 10000000) {
            return '₹' + (num / 10000000).toFixed(2) + ' Cr';
        } else if (num >= 100000) {
            return '₹' + (num / 100000).toFixed(2) + ' L';
        } else {
            return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    },

    formatPercent(value) {
        if (!value) return '0.00%';
        const num = parseFloat(String(value).replace(/[%+\s]/g, ''));
        if (isNaN(num)) return '0.00%';
        const sign = num >= 0 ? '+' : '';
        return `${sign}${num.toFixed(2)}%`;
    },

    getChangeClass(value) {
        const num = parseFloat(String(value).replace(/[%+\s]/g, ''));
        return num >= 0 ? 'positive' : 'negative';
    },

    extractValue(data) {
        if (!data) return 0;
        if (typeof data === 'number') return data;
        if (typeof data === 'object') return data.value || data.price || data.ltp || 0;
        return parseFloat(String(data).replace(/[₹,%+\s]/g, '')) || 0;
    }
};

// ====================
// Price Shockers
// ====================
async function loadPriceShockers() {
    const container = document.getElementById('priceShockersContent');
    container.innerHTML = '<div class="loading-state">Loading price shockers...</div>';

    const result = await api.get('/price_shockers');

    if (result.success && result.data) {
        let items = [];

        if (Array.isArray(result.data)) {
            items = result.data;
        } else if (result.data.priceShockers) {
            items = result.data.priceShockers;
        } else if (result.data.price_shockers) {
            items = result.data.price_shockers;
        }

        if (items.length === 0) {
            container.innerHTML = '<div class="empty-section"><div class="empty-section-icon">⚡</div><p>No price shockers available</p></div>';
            return;
        }

        container.innerHTML = items.slice(0, 10).map(item => {
            const name = item.company_name || item.name || item.symbol || 'Unknown';
            const symbol = item.symbol || item.ticker || '';
            const price = utils.extractValue(item.price || item.ltp || item.currentPrice);
            const change = utils.extractValue(item.change || item.pChange || item.change_percent);
            const changeClass = utils.getChangeClass(change);
            const icon = change >= 0 ? '📈' : '📉';

            return `
        <div class="stock-item">
          <span class="stock-item-icon">${icon}</span>
          <div class="stock-item-info">
            <div class="stock-item-name">${name}</div>
            <div class="stock-item-symbol">${symbol}</div>
          </div>
          <div class="stock-item-stats">
            <div class="stock-item-price">${utils.formatCurrency(price)}</div>
            <div class="stock-item-change ${changeClass}">${utils.formatPercent(change)}</div>
          </div>
        </div>
      `;
        }).join('');
    } else {
        container.innerHTML = '<div class="error-state">Failed to load price shockers</div>';
    }
}

// ====================
// Market News
// ====================
async function loadNews() {
    const container = document.getElementById('newsContent');
    container.innerHTML = '<div class="loading-state">Loading news...</div>';

    const result = await api.get('/news');

    if (result.success && result.data) {
        let items = [];

        if (Array.isArray(result.data)) {
            items = result.data;
        } else if (result.data.news) {
            items = result.data.news;
        } else if (result.data.articles) {
            items = result.data.articles;
        }

        if (items.length === 0) {
            container.innerHTML = '<div class="empty-section"><div class="empty-section-icon">📰</div><p>No news available</p></div>';
            return;
        }

        container.innerHTML = items.slice(0, 8).map(item => {
            const title = item.title || item.headline || item.summary || 'No title';
            const source = item.source || item.publisher || 'Unknown source';
            const time = item.time || item.date || item.published || '';

            return `
        <div class="news-item" onclick="openNews('${item.url || '#'}')">
          <div class="news-item-title">${title}</div>
          <div class="news-item-meta">
            <span>📰 ${source}</span>
            <span>🕐 ${time}</span>
          </div>
        </div>
      `;
        }).join('');
    } else {
        container.innerHTML = '<div class="error-state">Failed to load news</div>';
    }
}

function openNews(url) {
    if (url && url !== '#') {
        window.open(url, '_blank');
    }
}

// ====================
// IPO Watch
// ====================
async function loadIPO() {
    const container = document.getElementById('ipoContent');
    container.innerHTML = '<div class="loading-state">Loading IPOs...</div>';

    const result = await api.get('/ipo');

    if (result.success && result.data) {
        let items = [];

        if (Array.isArray(result.data)) {
            items = result.data;
        } else if (result.data.ipos) {
            items = result.data.ipos;
        } else if (result.data.ipo_data) {
            items = result.data.ipo_data;
        } else if (result.data.upcoming) {
            items = [...(result.data.upcoming || []), ...(result.data.ongoing || []), ...(result.data.recent || [])];
        }

        if (items.length === 0) {
            container.innerHTML = '<div class="empty-section"><div class="empty-section-icon">🚀</div><p>No IPOs available</p></div>';
            return;
        }

        container.innerHTML = items.slice(0, 6).map(item => {
            const name = item.company_name || item.name || item.issuer || 'Unknown IPO';
            const status = item.status || 'upcoming';
            const price = item.price || item.issue_price || item.price_band || '-';
            const dates = item.dates || item.issue_dates || item.open_date || '-';

            let statusClass = 'upcoming';
            if (status.toLowerCase().includes('open')) statusClass = 'open';
            else if (status.toLowerCase().includes('close')) statusClass = 'closed';

            return `
        <div class="ipo-item">
          <span class="ipo-badge ${statusClass}">${status}</span>
          <div class="ipo-info">
            <div class="ipo-name">${name}</div>
            <div class="ipo-details">📅 ${dates}</div>
          </div>
          <div class="ipo-price">${price}</div>
        </div>
      `;
        }).join('');
    } else {
        container.innerHTML = '<div class="error-state">Failed to load IPOs</div>';
    }
}

// ====================
// Commodities
// ====================
async function loadCommodities() {
    const container = document.getElementById('commoditiesContent');
    container.innerHTML = '<div class="loading-state">Loading commodities...</div>';

    const result = await api.get('/commodities');

    if (result.success && result.data) {
        let items = [];

        if (Array.isArray(result.data)) {
            items = result.data;
        } else if (result.data.commodities) {
            items = result.data.commodities;
        }

        if (items.length === 0) {
            container.innerHTML = '<div class="empty-section"><div class="empty-section-icon">🪙</div><p>No commodities data</p></div>';
            return;
        }

        const icons = {
            'gold': '🥇',
            'silver': '🥈',
            'crude': '🛢️',
            'oil': '🛢️',
            'copper': '🔶',
            'aluminium': '🔷',
            'zinc': '⬜',
            'lead': '⚪',
            'natural gas': '🔥',
            'cotton': '☁️'
        };

        container.innerHTML = items.slice(0, 8).map(item => {
            const name = item.name || item.commodity || 'Unknown';
            const price = utils.extractValue(item.price || item.value || item.ltp);
            const change = utils.extractValue(item.change || item.pChange);
            const unit = item.unit || 'per unit';
            const changeClass = utils.getChangeClass(change);

            const icon = Object.entries(icons).find(([k]) => name.toLowerCase().includes(k))?.[1] || '📦';

            return `
        <div class="commodity-item">
          <div class="commodity-icon">${icon}</div>
          <div class="commodity-info">
            <div class="commodity-name">${name}</div>
            <div class="commodity-unit">${unit}</div>
          </div>
          <div class="commodity-stats">
            <div class="commodity-price">${utils.formatCurrency(price)}</div>
            <div class="commodity-change ${changeClass}">${utils.formatPercent(change)}</div>
          </div>
        </div>
      `;
        }).join('');
    } else {
        container.innerHTML = '<div class="error-state">Failed to load commodities</div>';
    }
}

// ====================
// Mutual Funds
// ====================
async function loadMutualFunds() {
    const container = document.getElementById('mutualFundsContent');
    container.innerHTML = '<div class="loading-state">Loading mutual funds...</div>';

    const result = await api.get('/mutual_funds');

    if (result.success && result.data) {
        let items = [];

        if (Array.isArray(result.data)) {
            items = result.data;
        } else if (result.data.mutual_funds) {
            items = result.data.mutual_funds;
        } else if (result.data.funds) {
            items = result.data.funds;
        }

        if (items.length === 0) {
            container.innerHTML = '<div class="empty-section"><div class="empty-section-icon">💰</div><p>No mutual funds data</p></div>';
            return;
        }

        container.innerHTML = items.slice(0, 8).map(item => {
            const name = item.name || item.scheme_name || item.fund_name || 'Unknown Fund';
            const nav = utils.extractValue(item.nav || item.value || item.price);
            const returns = utils.extractValue(item.returns || item.returns_1yr || item.return);
            const category = item.category || item.fund_type || '';
            const changeClass = utils.getChangeClass(returns);

            const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

            return `
        <div class="mf-item">
          <div class="mf-icon">${initials}</div>
          <div class="mf-info">
            <div class="mf-name">${name}</div>
            <div class="mf-category">${category}</div>
          </div>
          <div class="mf-stats">
            <div class="mf-nav">${utils.formatCurrency(nav)}</div>
            <div class="mf-returns ${changeClass}">${utils.formatPercent(returns)}</div>
          </div>
        </div>
      `;
        }).join('');
    } else {
        container.innerHTML = '<div class="error-state">Failed to load mutual funds</div>';
    }
}

async function searchMutualFunds(event) {
    if (event.key !== 'Enter') return;

    const query = event.target.value.trim();
    if (!query) {
        loadMutualFunds();
        return;
    }

    const container = document.getElementById('mutualFundsContent');
    container.innerHTML = '<div class="loading-state">Searching...</div>';

    const result = await api.get('/mutual_fund_search?query=' + encodeURIComponent(query));

    if (result.success && result.data) {
        let items = Array.isArray(result.data) ? result.data : (result.data.results || result.data.funds || []);

        if (items.length === 0) {
            container.innerHTML = '<div class="empty-section"><div class="empty-section-icon">🔍</div><p>No funds found for "' + query + '"</p></div>';
            return;
        }

        container.innerHTML = items.slice(0, 8).map(item => {
            const name = item.name || item.scheme_name || 'Unknown Fund';
            const nav = utils.extractValue(item.nav || item.value);
            const returns = utils.extractValue(item.returns || 0);
            const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

            return `
        <div class="mf-item">
          <div class="mf-icon">${initials}</div>
          <div class="mf-info">
            <div class="mf-name">${name}</div>
          </div>
          <div class="mf-stats">
            <div class="mf-nav">${utils.formatCurrency(nav)}</div>
            <div class="mf-returns ${utils.getChangeClass(returns)}">${utils.formatPercent(returns)}</div>
          </div>
        </div>
      `;
        }).join('');
    } else {
        container.innerHTML = '<div class="error-state">Search failed</div>';
    }
}

// ====================
// Most Active Stocks
// ====================
async function loadMostActive() {
    const container = document.getElementById('mostActiveContent');
    container.innerHTML = '<div class="loading-state">Loading most active stocks...</div>';

    const endpoint = state.currentExchange === 'nse' ? '/nse_most_active' : '/bse_most_active';
    const result = await api.get(endpoint);

    if (result.success && result.data) {
        let items = [];

        if (Array.isArray(result.data)) {
            items = result.data;
        } else if (result.data.stocks) {
            items = result.data.stocks;
        } else if (result.data.most_active) {
            items = result.data.most_active;
        }

        if (items.length === 0) {
            container.innerHTML = '<div class="empty-section"><div class="empty-section-icon">🔥</div><p>No data available</p></div>';
            return;
        }

        container.innerHTML = items.slice(0, 10).map(item => {
            const name = item.company_name || item.name || item.symbol || 'Unknown';
            const symbol = item.symbol || '';
            const price = utils.extractValue(item.price || item.ltp || item.currentPrice);
            const change = utils.extractValue(item.change || item.pChange);
            const changeClass = utils.getChangeClass(change);

            return `
        <div class="stock-item">
          <span class="stock-item-icon">🔥</span>
          <div class="stock-item-info">
            <div class="stock-item-name">${name}</div>
            <div class="stock-item-symbol">${symbol}</div>
          </div>
          <div class="stock-item-stats">
            <div class="stock-item-price">${utils.formatCurrency(price)}</div>
            <div class="stock-item-change ${changeClass}">${utils.formatPercent(change)}</div>
          </div>
        </div>
      `;
        }).join('');
    } else {
        container.innerHTML = '<div class="error-state">Failed to load data</div>';
    }
}

function switchExchange(exchange) {
    state.currentExchange = exchange;

    document.querySelectorAll('.toggle-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.exchange === exchange);
    });

    loadMostActive();
}

// ====================
// Refresh All Data
// ====================
function refreshAllData() {
    loadPriceShockers();
    loadNews();
    loadIPO();
    loadCommodities();
    loadMutualFunds();
    loadMostActive();
    showToast('Dashboard refreshed', 'success');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : 'ℹ'}</span>
    <span class="toast-message">${message}</span>
  `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function loadUserBalance() {
    const savedBalance = localStorage.getItem('stockquest_balance');
    if (savedBalance) {
        state.balance = parseFloat(savedBalance);
    }
    document.getElementById('userBalance').textContent = utils.formatCurrency(state.balance);
}

// ====================
// Initialize
// ====================
document.addEventListener('DOMContentLoaded', () => {
    loadUserBalance();
    loadPriceShockers();
    loadNews();
    loadIPO();
    loadCommodities();
    loadMutualFunds();
    loadMostActive();
});
