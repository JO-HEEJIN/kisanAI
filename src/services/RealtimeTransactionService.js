/**
 * Real-time Transaction Data Simulation Service
 * Simulates live farmland market activity with realistic data patterns
 */

class RealtimeTransactionService {
    constructor() {
        this.isActive = false;
        this.transactions = [];
        this.subscribers = new Set();
        this.intervalId = null;
        this.marketData = null;
        this.priceHistory = new Map();
        this.countyPrices = new Map();
        this.initialize();
    }

    /**
     * Initialize the real-time transaction service
     */
    async initialize() {
        try {
            // Load initial market data
            this.marketData = await this.loadMarketData();

            // Initialize county price baselines
            this.initializeCountyPrices();

            // Generate initial transaction history
            this.transactions = this.generateHistoricalTransactions(50);

            console.log('📊 Real-time Transaction Service initialized');
        } catch (error) {
            console.error('Failed to initialize transaction service:', error);
        }
    }

    /**
     * Load market data and price baselines
     */
    async loadMarketData() {
        // In real implementation, this would connect to actual market APIs
        return {
            counties: [
                { name: 'Story', state: 'IA', basePrice: 4200, volatility: 0.15, trend: 0.05 },
                { name: 'Polk', state: 'IA', basePrice: 3800, volatility: 0.12, trend: 0.03 },
                { name: 'Warren', state: 'IA', basePrice: 4500, volatility: 0.18, trend: 0.07 },
                { name: 'Madison', state: 'IA', basePrice: 3200, volatility: 0.20, trend: -0.02 },
                { name: 'Dallas', state: 'IA', basePrice: 4000, volatility: 0.14, trend: 0.04 },
                { name: 'Boone', state: 'IA', basePrice: 3600, volatility: 0.16, trend: 0.02 },
                // Add more counties for realistic market coverage
                { name: 'Hamilton', state: 'IA', basePrice: 3900, volatility: 0.13, trend: 0.03 },
                { name: 'Hardin', state: 'IA', basePrice: 3400, volatility: 0.17, trend: 0.01 }
            ],
            buyers: [
                'Individual Investor',
                'Family Farm Corporation',
                'Agricultural Investment Fund',
                'Private Equity Group',
                'Institutional Investor',
                'Local Farmer',
                'Real Estate Investment Trust',
                'Foreign Investment Group',
                'Pension Fund',
                'Agricultural Cooperative'
            ],
            marketConditions: {
                currentSentiment: 'bullish', // bullish, bearish, neutral
                averageDaysOnMarket: 45,
                inventoryLevel: 'low', // low, medium, high
                seasonalFactor: this.getSeasonalFactor()
            }
        };
    }

    /**
     * Initialize county price baselines with historical trends
     */
    initializeCountyPrices() {
        this.marketData.counties.forEach(county => {
            const countyKey = `${county.name}, ${county.state}`;
            this.countyPrices.set(countyKey, {
                currentPrice: county.basePrice,
                trend: county.trend,
                volatility: county.volatility,
                lastUpdate: new Date(),
                monthlyChange: 0
            });
        });
    }

    /**
     * Get seasonal factor for agricultural land prices
     */
    getSeasonalFactor() {
        const month = new Date().getMonth();
        // Spring (Mar-May): Higher activity
        // Summer (Jun-Aug): Peak activity
        // Fall (Sep-Nov): High activity (harvest season)
        // Winter (Dec-Feb): Lower activity
        const seasonalFactors = [0.8, 0.8, 1.1, 1.2, 1.3, 1.4, 1.4, 1.3, 1.2, 1.1, 1.0, 0.9];
        return seasonalFactors[month];
    }

    /**
     * Generate historical transactions for initial data
     */
    generateHistoricalTransactions(count) {
        const transactions = [];
        const now = new Date();

        for (let i = 0; i < count; i++) {
            // Generate transactions over the past 30 days
            const daysAgo = Math.random() * 30;
            const transactionDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

            const transaction = this.generateRealisticTransaction(transactionDate);
            transactions.push(transaction);
        }

        // Sort by date (newest first)
        return transactions.sort((a, b) => b.date - a.date);
    }

    /**
     * Generate a realistic transaction
     */
    generateRealisticTransaction(date = new Date()) {
        const county = this.marketData.counties[Math.floor(Math.random() * this.marketData.counties.length)];
        const buyer = this.marketData.buyers[Math.floor(Math.random() * this.marketData.buyers.length)];

        // Generate realistic farm characteristics
        const acres = this.generateRealisticAcres();
        const basePrice = county.basePrice;
        const priceVariation = (Math.random() - 0.5) * 2 * county.volatility;
        const seasonalAdjustment = this.marketData.marketConditions.seasonalFactor;

        // Calculate price per acre with various factors
        let pricePerAcre = basePrice * (1 + priceVariation) * seasonalAdjustment;

        // Quality adjustments
        const qualityFactor = Math.random(); // 0-1 quality score
        if (qualityFactor > 0.8) pricePerAcre *= 1.15; // Premium land
        else if (qualityFactor < 0.3) pricePerAcre *= 0.85; // Below average land

        // Size premium/discount
        if (acres > 500) pricePerAcre *= 1.05; // Large tract premium
        else if (acres < 40) pricePerAcre *= 0.95; // Small tract discount

        pricePerAcre = Math.round(pricePerAcre);
        const totalPrice = Math.round(acres * pricePerAcre);

        // Calculate previous price for appreciation calculation
        const previousPricePerAcre = basePrice * 0.95 + Math.random() * basePrice * 0.1;
        const appreciation = ((pricePerAcre - previousPricePerAcre) / previousPricePerAcre * 100);

        return {
            id: Date.now() + Math.random(),
            date: date,
            county: county.name,
            state: county.state,
            acres: acres,
            pricePerAcre: pricePerAcre,
            totalPrice: totalPrice,
            buyer: buyer,
            seller: this.generateSellerType(),
            appreciation: Math.round(appreciation * 100) / 100,
            daysOnMarket: Math.floor(Math.random() * 120) + 15,
            soilQuality: Math.floor(Math.random() * 30) + 70, // 70-100
            waterRights: Math.random() > 0.6,
            organic: Math.random() > 0.8,
            cropTypes: this.generateCropTypes(),
            coordinates: this.generateCoordinates(county),
            marketCondition: this.assessMarketCondition(appreciation)
        };
    }

    /**
     * Generate realistic farm acreage
     */
    generateRealisticAcres() {
        const random = Math.random();

        // Weighted distribution based on actual farm sizes
        if (random < 0.3) return Math.floor(Math.random() * 40) + 10; // Small: 10-50 acres
        else if (random < 0.6) return Math.floor(Math.random() * 120) + 50; // Medium: 50-170 acres
        else if (random < 0.85) return Math.floor(Math.random() * 330) + 170; // Large: 170-500 acres
        else return Math.floor(Math.random() * 1000) + 500; // Very Large: 500-1500 acres
    }

    /**
     * Generate seller type
     */
    generateSellerType() {
        const sellerTypes = [
            'Retiring Farmer',
            'Estate Sale',
            'Corporate Divestiture',
            'Investment Fund',
            'Family Trust',
            'Agricultural Cooperative',
            'Individual Owner',
            'Farm Partnership'
        ];
        return sellerTypes[Math.floor(Math.random() * sellerTypes.length)];
    }

    /**
     * Generate realistic crop types for the land
     */
    generateCropTypes() {
        const crops = ['Corn', 'Soybeans', 'Wheat', 'Hay', 'Pasture', 'Oats', 'Barley'];
        const selectedCrops = [];
        const numCrops = Math.random() > 0.7 ? 2 : 1; // 70% single crop, 30% rotation

        for (let i = 0; i < numCrops; i++) {
            const crop = crops[Math.floor(Math.random() * crops.length)];
            if (!selectedCrops.includes(crop)) {
                selectedCrops.push(crop);
            }
        }

        return selectedCrops.length > 0 ? selectedCrops : ['Corn'];
    }

    /**
     * Generate realistic coordinates within county bounds
     */
    generateCoordinates(county) {
        // Iowa county approximate centers with slight variation
        const countyCoords = {
            'Story': { lat: 42.0308, lon: -93.6250 },
            'Polk': { lat: 41.6005, lon: -93.7751 },
            'Warren': { lat: 41.4818, lon: -93.4623 },
            'Madison': { lat: 41.3373, lon: -93.8042 },
            'Dallas': { lat: 41.6847, lon: -94.0142 },
            'Boone': { lat: 42.0597, lon: -93.8802 },
            'Hamilton': { lat: 42.2819, lon: -93.6405 },
            'Hardin': { lat: 42.3175, lon: -93.2357 }
        };

        const center = countyCoords[county.name] || { lat: 42.0, lon: -93.5 };

        return {
            lat: center.lat + (Math.random() - 0.5) * 0.3, // ±0.15 degree variation
            lon: center.lon + (Math.random() - 0.5) * 0.3
        };
    }

    /**
     * Assess market condition based on price appreciation
     */
    assessMarketCondition(appreciation) {
        if (appreciation > 10) return 'Hot';
        else if (appreciation > 5) return 'Strong';
        else if (appreciation > 0) return 'Stable';
        else if (appreciation > -5) return 'Cooling';
        else return 'Weak';
    }

    /**
     * Start real-time transaction simulation
     */
    startRealTimeUpdates() {
        if (this.isActive) return;

        this.isActive = true;
        console.log('📈 Starting real-time transaction updates');

        // Generate new transactions at realistic intervals
        this.intervalId = setInterval(() => {
            this.generateNewTransaction();
        }, this.getRandomInterval());

        // Update market conditions periodically
        setInterval(() => {
            this.updateMarketConditions();
        }, 5 * 60 * 1000); // Every 5 minutes
    }

    /**
     * Get random interval for next transaction (realistic timing)
     */
    getRandomInterval() {
        // Base interval: 30-180 seconds
        const baseInterval = 30000 + Math.random() * 150000;

        // Apply seasonal and market condition factors
        const seasonalFactor = this.marketData.marketConditions.seasonalFactor;
        const marketFactor = this.marketData.marketConditions.currentSentiment === 'bullish' ? 0.7 :
                             this.marketData.marketConditions.currentSentiment === 'bearish' ? 1.5 : 1.0;

        return Math.round(baseInterval * marketFactor / seasonalFactor);
    }

    /**
     * Generate a new transaction and notify subscribers
     */
    generateNewTransaction() {
        const transaction = this.generateRealisticTransaction();

        // Add to transaction history (keep only latest 100)
        this.transactions.unshift(transaction);
        if (this.transactions.length > 100) {
            this.transactions = this.transactions.slice(0, 100);
        }

        // Update county price tracking
        this.updateCountyPrice(transaction);

        // Notify all subscribers
        this.notifySubscribers({
            type: 'newTransaction',
            data: transaction,
            marketStats: this.getMarketStatistics()
        });

        console.log(`🏡 New transaction: ${transaction.acres} acres in ${transaction.county}, ${transaction.state} for $${transaction.pricePerAcre.toLocaleString()}/acre`);
    }

    /**
     * Update county price based on recent transaction
     */
    updateCountyPrice(transaction) {
        const countyKey = `${transaction.county}, ${transaction.state}`;
        const priceData = this.countyPrices.get(countyKey);

        if (priceData) {
            // Weighted average with recent transaction (10% weight)
            const newPrice = priceData.currentPrice * 0.9 + transaction.pricePerAcre * 0.1;
            priceData.currentPrice = Math.round(newPrice);
            priceData.lastUpdate = new Date();

            this.countyPrices.set(countyKey, priceData);
        }
    }

    /**
     * Update overall market conditions
     */
    updateMarketConditions() {
        // Analyze recent transactions for market sentiment
        const recentTransactions = this.transactions.slice(0, 20);
        const avgAppreciation = recentTransactions.reduce((sum, t) => sum + t.appreciation, 0) / recentTransactions.length;

        // Update sentiment based on price trends
        if (avgAppreciation > 5) {
            this.marketData.marketConditions.currentSentiment = 'bullish';
        } else if (avgAppreciation < -2) {
            this.marketData.marketConditions.currentSentiment = 'bearish';
        } else {
            this.marketData.marketConditions.currentSentiment = 'neutral';
        }

        // Update seasonal factor
        this.marketData.marketConditions.seasonalFactor = this.getSeasonalFactor();

        console.log(`📊 Market conditions updated: ${this.marketData.marketConditions.currentSentiment} sentiment, ${avgAppreciation.toFixed(1)}% avg appreciation`);
    }

    /**
     * Get current market statistics
     */
    getMarketStatistics() {
        const recent = this.transactions.slice(0, 20);

        return {
            totalTransactions: this.transactions.length,
            avgPricePerAcre: Math.round(recent.reduce((sum, t) => sum + t.pricePerAcre, 0) / recent.length),
            avgAppreciation: Math.round(recent.reduce((sum, t) => sum + t.appreciation, 0) / recent.length * 100) / 100,
            totalVolume: recent.reduce((sum, t) => sum + t.totalPrice, 0),
            avgDaysOnMarket: Math.round(recent.reduce((sum, t) => sum + t.daysOnMarket, 0) / recent.length),
            marketSentiment: this.marketData.marketConditions.currentSentiment,
            activeCounties: new Set(recent.map(t => t.county)).size
        };
    }

    /**
     * Stop real-time updates
     */
    stopRealTimeUpdates() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isActive = false;
        console.log('📉 Real-time transaction updates stopped');
    }

    /**
     * Subscribe to real-time updates
     */
    subscribe(callback) {
        this.subscribers.add(callback);

        // Send initial data
        callback({
            type: 'initial',
            data: this.transactions,
            marketStats: this.getMarketStatistics()
        });

        return () => {
            this.subscribers.delete(callback);
        };
    }

    /**
     * Notify all subscribers of updates
     */
    notifySubscribers(update) {
        this.subscribers.forEach(callback => {
            try {
                callback(update);
            } catch (error) {
                console.error('Error notifying subscriber:', error);
            }
        });
    }

    /**
     * Get all transactions
     */
    getTransactions() {
        return this.transactions;
    }

    /**
     * Get county price data
     */
    getCountyPrices() {
        return Array.from(this.countyPrices.entries()).map(([county, data]) => ({
            county,
            ...data
        }));
    }

    /**
     * Get transactions by county
     */
    getTransactionsByCounty(county, state) {
        return this.transactions.filter(t =>
            t.county.toLowerCase() === county.toLowerCase() &&
            t.state.toLowerCase() === state.toLowerCase()
        );
    }

    /**
     * Get price trends for specific county
     */
    getCountyTrends(county, state) {
        const transactions = this.getTransactionsByCounty(county, state);

        if (transactions.length < 2) return null;

        const sortedTransactions = transactions.sort((a, b) => a.date - b.date);
        const pricePoints = sortedTransactions.map(t => ({
            date: t.date,
            price: t.pricePerAcre
        }));

        return {
            county: `${county}, ${state}`,
            priceHistory: pricePoints,
            currentPrice: sortedTransactions[sortedTransactions.length - 1].pricePerAcre,
            trend: this.calculateTrend(pricePoints),
            volatility: this.calculateVolatility(pricePoints)
        };
    }

    /**
     * Calculate price trend
     */
    calculateTrend(pricePoints) {
        if (pricePoints.length < 2) return 0;

        const first = pricePoints[0].price;
        const last = pricePoints[pricePoints.length - 1].price;

        return ((last - first) / first) * 100;
    }

    /**
     * Calculate price volatility
     */
    calculateVolatility(pricePoints) {
        if (pricePoints.length < 2) return 0;

        const prices = pricePoints.map(p => p.price);
        const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;

        return Math.sqrt(variance) / mean * 100; // Coefficient of variation as percentage
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeTransactionService;
}

// Global instance for browser use
if (typeof window !== 'undefined') {
    window.RealtimeTransactionService = RealtimeTransactionService;
}