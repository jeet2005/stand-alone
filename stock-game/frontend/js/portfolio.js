/**
 * Portfolio Page JavaScript
 */

// State
let state = {
    balance: 1000000,
    portfolios: [],
    totalInvested: 0,
    totalReturns: 0
};

// Utility functions
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

    formatPercent(value) {
        if (!value) return '+0.00%';
        const num = parseFloat(value);
        const sign = num >= 0 ? '+' : '';
        return `${sign}${num.toFixed(2)}%`;
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: '2-digit',
            year: 'numeric'
        });
    }
};

// Load data
function loadPortfolios() {
    // Load from localStorage
    const savedBalance = localStorage.getItem('stockquest_balance');
    if (savedBalance) {
        state.balance = parseFloat(savedBalance);
    }

    const savedPortfolios = localStorage.getItem('stockquest_portfolios');
    if (savedPortfolios) {
        state.portfolios = JSON.parse(savedPortfolios);
    }

    // Calculate totals
    state.totalInvested = state.portfolios.reduce((sum, p) => sum + p.invested, 0);

    // Simulate returns (in real app, would fetch live prices)
    state.portfolios.forEach(p => {
        const randomReturn = (Math.random() - 0.5) * 10; // -5% to +5%
        p.currentValue = p.invested * (1 + randomReturn / 100);
        p.returns = ((p.currentValue - p.invested) / p.invested) * 100;
        p.points = Math.floor(Math.random() * 1000);
    });

    state.totalReturns = state.portfolios.reduce((sum, p) => sum + (p.currentValue - p.invested), 0);

    updateUI();
}

function updateUI() {
    // Update balance
    document.getElementById('userBalance').textContent = utils.formatCurrency(state.balance);
    document.getElementById('availableBalance').textContent = utils.formatCurrency(state.balance);

    // Update summary cards
    document.getElementById('totalInvested').textContent = utils.formatCurrency(state.totalInvested);

    const returnsEl = document.getElementById('totalReturns');
    returnsEl.textContent = utils.formatCurrency(Math.abs(state.totalReturns));
    returnsEl.className = `summary-value ${state.totalReturns >= 0 ? 'positive' : 'negative'}`;
    if (state.totalReturns >= 0) {
        returnsEl.textContent = '+' + returnsEl.textContent;
    } else {
        returnsEl.textContent = '-' + returnsEl.textContent;
    }

    document.getElementById('portfolioCount').textContent = state.portfolios.length;

    // Render portfolios
    renderPortfolios();
}

function renderPortfolios() {
    const container = document.getElementById('portfoliosList');

    if (state.portfolios.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💼</div>
        <div class="empty-state-title">No Portfolios Yet</div>
        <p class="empty-state-description">Create your first portfolio by selecting stocks from the Stocks page.</p>
        <a href="/" class="btn btn-primary">Start Building</a>
      </div>
    `;
        return;
    }

    container.innerHTML = state.portfolios.map((portfolio, index) => {
        const returnsClass = portfolio.returns >= 0 ? 'positive' : 'negative';

        return `
      <div class="portfolio-card">
        <div class="portfolio-card-header">
          <div>
            <div class="portfolio-title">Portfolio Summary</div>
            <div class="portfolio-date">
              📅 Created ${utils.formatDate(portfolio.createdAt)}
            </div>
          </div>
          <div class="portfolio-points">
            <div class="portfolio-points-label">Points</div>
            <div class="portfolio-points-value">${portfolio.points || 0}</div>
          </div>
        </div>
        
        <div class="portfolio-stats-row">
          <div class="portfolio-stat">
            <div class="portfolio-stat-label">Invested</div>
            <div class="portfolio-stat-value">${utils.formatCurrency(portfolio.invested)}</div>
          </div>
          <div class="portfolio-stat">
            <div class="portfolio-stat-label">Current Value</div>
            <div class="portfolio-stat-value">${utils.formatCurrency(portfolio.currentValue || portfolio.invested)}</div>
          </div>
          <div class="portfolio-stat">
            <div class="portfolio-stat-label">Returns</div>
            <div class="portfolio-stat-value ${returnsClass}">${utils.formatPercent(portfolio.returns || 0)}</div>
          </div>
        </div>
        
        <div class="stock-chips">
          <div class="stock-chips-label">Stocks (${portfolio.stocks.length})</div>
          ${portfolio.stocks.map(stock => {
            const isCaptain = stock.symbol === portfolio.captain;
            const isVC = stock.symbol === portfolio.viceCaptain;
            const chipClass = isCaptain ? 'captain' : isVC ? 'vc' : '';
            const badge = isCaptain ? '<span class="chip-badge">👑</span>' : isVC ? '<span class="chip-badge">⭐</span>' : '';

            return `
              <span class="stock-chip ${chipClass}">
                ${badge}${stock.symbol}
              </span>
            `;
        }).join('')}
        </div>
      </div>
    `;
    }).join('');
}

function refreshData() {
    loadPortfolios();
    showToast('Data refreshed', 'success');
}

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

// Initialize
document.addEventListener('DOMContentLoaded', loadPortfolios);
