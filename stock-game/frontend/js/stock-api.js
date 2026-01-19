/**
 * StockQuest v2 - Direct Stock API Client
 * Calls Indian Stock API directly from frontend
 */

const StockAPI = {
    // API configuration
    baseUrl: 'https://stock.indianapi.in',
    apiKey: null, // Will be loaded from Firebase or env

    // Cache for API responses
    cache: new Map(),
    cacheTimeout: 5 * 60 * 1000, // 5 minutes

    // Initialize with API key
    init(apiKey) {
        this.apiKey = apiKey;
        console.log('[StockAPI] Initialized');
    },

    // Generic API request
    async request(endpoint, params = {}) {
        const cacheKey = endpoint + JSON.stringify(params);

        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            let url = this.baseUrl + endpoint;
            const queryString = new URLSearchParams(params).toString();
            if (queryString) url += '?' + queryString;

            const response = await fetch(url, {
                headers: {
                    'X-Api-Key': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            // Cache response
            this.cache.set(cacheKey, { data, timestamp: Date.now() });

            return data;
        } catch (error) {
            console.error('[StockAPI] Request failed:', endpoint, error);
            throw error;
        }
    },

    // Get trending stocks
    async getTrending() {
        const data = await this.request('/trending');
        return this.normalizeTrendingData(data);
    },

    // Search stock by name
    async searchStock(query) {
        const data = await this.request('/stock', { name: query });
        return this.normalizeStockData(data);
    },

    // Get stock details
    async getStockDetails(name) {
        const data = await this.request('/stock', { name });
        return this.normalizeStockData(data);
    },

    // Get historical data
    async getHistoricalData(stockName, period = '1m') {
        return await this.request('/historical_data', {
            stock_name: stockName,
            period: period
        });
    },

    // Get market news
    async getNews() {
        return await this.request('/news');
    },

    // Get IPO data
    async getIPO() {
        return await this.request('/ipo');
    },

    // Get commodities
    async getCommodities() {
        return await this.request('/commodities');
    },

    // Get NSE most active
    async getNSEMostActive() {
        const data = await this.request('/nse_most_active');
        return this.normalizeListData(data);
    },

    // Get BSE most active
    async getBSEMostActive() {
        const data = await this.request('/bse_most_active');
        return this.normalizeListData(data);
    },

    // Get price shockers
    async getPriceShockers() {
        const data = await this.request('/price_shockers');
        return this.normalizeListData(data);
    },

    // Normalize trending data from API
    normalizeTrendingData(data) {
        if (!data) return [];

        let stocks = [];

        if (data.trending_stocks) {
            const ts = data.trending_stocks;
            if (ts.top_gainers) stocks.push(...ts.top_gainers);
            if (ts.top_losers) stocks.push(...ts.top_losers);
        } else if (Array.isArray(data)) {
            stocks = data;
        }

        return stocks.map(s => this.normalizeStockData(s));
    },

    // Normalize list data (most active, price shockers, etc)
    normalizeListData(data) {
        if (!data) return [];

        // Handle nested response structures
        let items = [];
        if (Array.isArray(data)) {
            items = data;
        } else if (data.data && Array.isArray(data.data)) {
            items = data.data;
        } else if (data.stocks) {
            items = data.stocks;
        } else if (data.most_active) {
            items = data.most_active;
        } else if (data.price_shockers) {
            items = data.price_shockers;
        }

        return items.map(item => this.normalizeStockData(item));
    },

    // Normalize individual stock data
    normalizeStockData(raw) {
        if (!raw) return null;

        // Extract name - try multiple field names
        const name = raw.company_name || raw.companyName || raw.name ||
            raw.longName || raw.shortName || raw.stock_name ||
            raw.scrip_name || raw.symbol || 'Unknown';

        // Extract symbol
        const symbol = raw.symbol || raw.ticker || raw.nseSymbol ||
            raw.bseSymbol || raw.stock_id ||
            name.substring(0, 6).toUpperCase().replace(/\s/g, '');

        // Parse price - handle nested objects
        let price = 0;
        if (raw.currentPrice) {
            price = this.parseNumber(raw.currentPrice);
        } else if (raw.current_price) {
            price = this.parseNumber(raw.current_price);
        } else if (raw.price) {
            price = this.parseNumber(raw.price);
        } else if (raw.ltp) {
            price = this.parseNumber(raw.ltp);
        } else if (raw.lastPrice) {
            price = this.parseNumber(raw.lastPrice);
        } else if (raw.close) {
            price = this.parseNumber(raw.close);
        }

        // Parse change percentage
        let change = 0;
        if (raw.pChange !== undefined) {
            change = this.parseNumber(raw.pChange);
        } else if (raw.change_percent !== undefined) {
            change = this.parseNumber(raw.change_percent);
        } else if (raw.changePercent !== undefined) {
            change = this.parseNumber(raw.changePercent);
        } else if (raw.percent_change !== undefined) {
            change = this.parseNumber(raw.percent_change);
        }

        return {
            id: symbol + '_' + Date.now(),
            name: name,
            symbol: symbol,
            price: price,
            change: change,
            volume: this.parseNumber(raw.volume || raw.tradedVolume || raw.totalTradedVolume || 0),
            high: this.parseNumber(raw.high || raw.dayHigh || 0),
            low: this.parseNumber(raw.low || raw.dayLow || 0),
            open: this.parseNumber(raw.open || 0),
            previousClose: this.parseNumber(raw.previousClose || raw.prev_close || 0),
            marketCap: this.parseNumber(raw.marketCap || raw.market_cap || 0),
            pe: this.parseNumber(raw.pe || raw.peRatio || 0),
            high52: this.parseNumber(raw.high52 || raw.week52High || raw.yearHigh || 0),
            low52: this.parseNumber(raw.low52 || raw.week52Low || raw.yearLow || 0),
            sector: raw.sector || raw.industry || '',
            raw: raw
        };
    },

    // Parse number from various formats
    parseNumber(value) {
        if (!value) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'object') {
            return this.parseNumber(value.value || value.price || value.ltp || 0);
        }
        const cleaned = String(value).replace(/[₹,%+\s,]/g, '');
        return parseFloat(cleaned) || 0;
    },

    // Clear cache
    clearCache() {
        this.cache.clear();
    }
};
