/**
 * StockQuest v2 - Firestore Database Operations
 * Handles portfolios, leaderboard, and user data
 */

const Database = {
    // Collections
    USERS: 'users',
    PORTFOLIOS: 'portfolios',
    LEADERBOARD: 'leaderboard',
    WATCHLIST: 'watchlist',

    // ==================
    // User Operations
    // ==================

    async getUser(uid) {
        const doc = await db.collection(this.USERS).doc(uid).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    async updateUser(uid, data) {
        await db.collection(this.USERS).doc(uid).update(data);
    },

    // ==================
    // Portfolio Operations
    // ==================

    async createPortfolio(uid, portfolioData) {
        const docRef = await db.collection(this.PORTFOLIOS).add({
            userId: uid,
            stocks: portfolioData.stocks,
            captain: portfolioData.captain,
            viceCaptain: portfolioData.viceCaptain,
            invested: portfolioData.invested,
            currentValue: portfolioData.invested,
            returns: 0,
            points: 0,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    },

    async getUserPortfolios(uid) {
        const snapshot = await db.collection(this.PORTFOLIOS)
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async updatePortfolio(portfolioId, data) {
        await db.collection(this.PORTFOLIOS).doc(portfolioId).update(data);
    },

    async deletePortfolio(portfolioId) {
        await db.collection(this.PORTFOLIOS).doc(portfolioId).delete();
    },

    // ==================
    // Leaderboard Operations
    // ==================

    async getLeaderboard(limit = 20) {
        const snapshot = await db.collection(this.LEADERBOARD)
            .orderBy('points', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map((doc, index) => ({
            id: doc.id,
            rank: index + 1,
            ...doc.data()
        }));
    },

    async updateLeaderboardEntry(uid, data) {
        await db.collection(this.LEADERBOARD).doc(uid).set({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    },

    async getUserRank(uid) {
        const userDoc = await db.collection(this.LEADERBOARD).doc(uid).get();
        if (!userDoc.exists) return null;

        const userPoints = userDoc.data().points || 0;
        const higherRanked = await db.collection(this.LEADERBOARD)
            .where('points', '>', userPoints)
            .get();

        return higherRanked.size + 1;
    },

    // ==================
    // Watchlist Operations
    // ==================

    async addToWatchlist(uid, stock) {
        await db.collection(this.WATCHLIST).add({
            userId: uid,
            symbol: stock.symbol,
            name: stock.name,
            addedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    async getWatchlist(uid) {
        const snapshot = await db.collection(this.WATCHLIST)
            .where('userId', '==', uid)
            .orderBy('addedAt', 'desc')
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async removeFromWatchlist(watchlistId) {
        await db.collection(this.WATCHLIST).doc(watchlistId).delete();
    },

    // ==================
    // Real-time Listeners
    // ==================

    onLeaderboardChange(callback) {
        return db.collection(this.LEADERBOARD)
            .orderBy('points', 'desc')
            .limit(20)
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map((doc, index) => ({
                    id: doc.id,
                    rank: index + 1,
                    ...doc.data()
                }));
                callback(data);
            });
    },

    onPortfoliosChange(uid, callback) {
        return db.collection(this.PORTFOLIOS)
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(data);
            });
    }
};
