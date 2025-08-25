/**
 * Market Service - Frontend
 * Service layer for market-related operations in the frontend
 */

class MarketService {
    constructor() {
        this.baseUrl = '/.netlify/functions';
    }

    /**
     * Get all markets for the current user
     */
    async getMarkets() {
        try {
            const response = await fetch(`${this.baseUrl}/get-markets`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const markets = await response.json();
            return Array.isArray(markets) ? markets : [];
        } catch (error) {
            console.error('Error fetching markets:', error);
            throw error;
        }
    }

    /**
     * Create a new market
     */
    async createMarket(marketData) {
        try {
            const response = await fetch(`${this.baseUrl}/create-markets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(marketData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating market:', error);
            throw error;
        }
    }

    /**
     * Search company by CNPJ
     */
    async searchByCnpj(cnpj) {
        try {
            const response = await fetch(`${this.baseUrl}/get-company-cnpj?cnpj=${cnpj}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error searching by CNPJ:', error);
            throw error;
        }
    }
}

// Export for browser and Node.js
if (typeof window !== 'undefined') {
    window.MarketService = MarketService;
    window.marketService = new MarketService();
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarketService;
}
