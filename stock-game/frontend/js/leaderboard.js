/**
 * Leaderboard Page JavaScript
 */

// Mock leaderboard data
const mockPlayers = [
    { id: 1, name: 'MarketGuru', initials: 'MA', portfolio: "MarketGuru's Portfolio", points: 4784, returns: -2.61 },
    { id: 2, name: 'StockWhiz', initials: 'ST', portfolio: "StockWhiz's Portfolio", points: 3757, returns: 3.72 },
    { id: 3, name: 'WealthBuilder', initials: 'WE', portfolio: "WealthBuilder's Portfolio", points: 2676, returns: -0.39 },
    { id: 4, name: 'TradeMaster', initials: 'TR', portfolio: "TradeMaster's Portfolio", points: 2413, returns: 23.61 },
    { id: 5, name: 'InvestorPro', initials: 'IN', portfolio: "InvestorPro's Portfolio", points: 2407, returns: -1.25 },
    { id: 6, name: 'BullRunner', initials: 'BU', portfolio: "BullRunner's Portfolio", points: 2156, returns: 5.44 },
    { id: 7, name: 'AlphaTrader', initials: 'AL', portfolio: "AlphaTrader's Portfolio", points: 1989, returns: -4.12 },
    { id: 8, name: 'GrowthSeeker', initials: 'GR', portfolio: "GrowthSeeker's Portfolio", points: 1876, returns: 0.88 },
    { id: 9, name: 'ValueHunter', initials: 'VA', portfolio: "ValueHunter's Portfolio", points: 1654, returns: 2.33 },
    { id: 10, name: 'DividendKing', initials: 'DI', portfolio: "DividendKing's Portfolio", points: 1543, returns: -0.77 }
];

// State
let state = {
    balance: 1000000,
    userRank: null,
    userPoints: 0,
    userReturns: 0
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
    }
};

// Load data
function loadLeaderboard() {
    // Load user balance
    const savedBalance = localStorage.getItem('stockquest_balance');
    if (savedBalance) {
        state.balance = parseFloat(savedBalance);
    }
    document.getElementById('userBalance').textContent = utils.formatCurrency(state.balance);

    // Load user portfolios to calculate rank
    const savedPortfolios = localStorage.getItem('stockquest_portfolios');
    if (savedPortfolios) {
        const portfolios = JSON.parse(savedPortfolios);
        if (portfolios.length > 0) {
            // Calculate user's total points
            state.userPoints = Math.floor(Math.random() * 3000) + 500; // Simulated
            state.userReturns = (Math.random() - 0.5) * 20; // Simulated -10% to +10%

            // Insert user into leaderboard
            const userRankIndex = mockPlayers.findIndex(p => p.points < state.userPoints);
            state.userRank = userRankIndex === -1 ? mockPlayers.length + 1 : userRankIndex + 1;
        }
    }

    renderLeaderboard();
    updateUserRankCard();
}

function renderLeaderboard() {
    // Update top 3 podium (already in HTML, just update dynamically if needed)
    updatePodium();

    // Render rankings list (4th place onwards)
    const rankingsList = document.getElementById('rankingsList');

    const rankings = mockPlayers.slice(3).map((player, index) => {
        const position = index + 4;
        const returnsClass = player.returns >= 0 ? 'positive' : 'negative';

        return `
      <div class="ranking-row">
        <div class="ranking-position">${position}</div>
        <div class="ranking-avatar">${player.initials}</div>
        <div class="ranking-info">
          <div class="ranking-name">${player.name}</div>
          <div class="ranking-portfolio">${player.portfolio}</div>
        </div>
        <div class="ranking-stats">
          <div class="ranking-points">${player.points.toLocaleString()}</div>
          <div class="ranking-returns ${returnsClass}">${utils.formatPercent(player.returns)}</div>
        </div>
      </div>
    `;
    }).join('');

    rankingsList.innerHTML = rankings;
}

function updatePodium() {
    // Update podium cards with data (already have static values in HTML)
    // This would be dynamic in a real app
    const top3 = mockPlayers.slice(0, 3);

    // Gold (1st place)
    const gold = document.getElementById('rank1');
    if (gold) {
        const player = top3[0];
        gold.querySelector('.podium-avatar').textContent = player.initials;
        gold.querySelector('.podium-name').textContent = player.name;
        gold.querySelector('.podium-portfolio').textContent = player.portfolio;
        gold.querySelector('.podium-points').innerHTML = `<span class="points-icon">📊</span> ${player.points.toLocaleString()} pts`;
        const returnsEl = gold.querySelector('.podium-returns');
        returnsEl.textContent = `${player.returns >= 0 ? '↗' : '↘'} ${utils.formatPercent(player.returns)}`;
        returnsEl.className = `podium-returns ${player.returns >= 0 ? 'positive' : 'negative'}`;
    }

    // Silver (2nd place)
    const silver = document.getElementById('rank2');
    if (silver) {
        const player = top3[1];
        silver.querySelector('.podium-avatar').textContent = player.initials;
        silver.querySelector('.podium-name').textContent = player.name;
        silver.querySelector('.podium-portfolio').textContent = player.portfolio;
        silver.querySelector('.podium-points').innerHTML = `<span class="points-icon">📊</span> ${player.points.toLocaleString()} pts`;
        const returnsEl = silver.querySelector('.podium-returns');
        returnsEl.textContent = `${player.returns >= 0 ? '↗' : '↘'} ${utils.formatPercent(player.returns)}`;
        returnsEl.className = `podium-returns ${player.returns >= 0 ? 'positive' : 'negative'}`;
    }

    // Bronze (3rd place)
    const bronze = document.getElementById('rank3');
    if (bronze) {
        const player = top3[2];
        bronze.querySelector('.podium-avatar').textContent = player.initials;
        bronze.querySelector('.podium-name').textContent = player.name;
        bronze.querySelector('.podium-portfolio').textContent = player.portfolio;
        bronze.querySelector('.podium-points').innerHTML = `<span class="points-icon">📊</span> ${player.points.toLocaleString()} pts`;
        const returnsEl = bronze.querySelector('.podium-returns');
        returnsEl.textContent = `${player.returns >= 0 ? '↗' : '↘'} ${utils.formatPercent(player.returns)}`;
        returnsEl.className = `podium-returns ${player.returns >= 0 ? 'positive' : 'negative'}`;
    }
}

function updateUserRankCard() {
    const card = document.getElementById('yourRankCard');
    if (!card) return;

    if (state.userRank) {
        card.querySelector('.your-rank-position').textContent = state.userRank;
        card.querySelector('.your-rank-points').textContent = `${state.userPoints.toLocaleString()} pts`;
        card.querySelector('.your-rank-returns').textContent = utils.formatPercent(state.userReturns);
        card.querySelector('.your-rank-returns').className = `your-rank-returns ${state.userReturns >= 0 ? '' : 'negative'}`;
    } else {
        card.querySelector('.your-rank-position').textContent = '-';
        card.querySelector('.your-rank-points').textContent = '0 pts';
        card.querySelector('.your-rank-returns').textContent = '+0.00%';
    }
}

function refreshData() {
    loadLeaderboard();
    showToast('Leaderboard refreshed', 'success');
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
document.addEventListener('DOMContentLoaded', loadLeaderboard);
