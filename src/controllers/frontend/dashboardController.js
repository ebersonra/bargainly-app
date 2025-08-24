class DashboardController {
    constructor() {
        this.bindEvents();
        this.init();
    }

    bindEvents() {
        const categoryPeriod = document.getElementById('categoryPeriod');
        if (categoryPeriod) {
            categoryPeriod.addEventListener('change', () => {
                this.updateCategoryChart();
            });
        }

        const trendPeriod = document.getElementById('trendPeriod');
        if (trendPeriod) {
            trendPeriod.addEventListener('change', () => {
                this.updateTrendChart();
            });
        }
    }

    async init() {
        try {
            await this.loadDashboardData();
        } catch (error) {
            console.error('Erro ao inicializar dashboard:', error);
        }
    }

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadSummaryStats(),
                this.loadRecentPurchases(),
                this.loadTopMarkets(),
                this.loadBestDeals(),
                this.loadBudgetProgress(),
                this.updateCategoryChart(),
                this.updateTrendChart()
            ]);
        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
        }
    }

    async loadSummaryStats() {
        try {
            // Get user ID
            const userId = typeof window !== 'undefined' && window.getUserId ? await window.getUserId() : null;
            if (!userId) return;

            // Simulate API calls for now - should integrate with actual services
            const stats = {
                totalSpent: 1247.50,
                monthlyGoal: 1500.00,
                totalSavings: 89.30,
                marketsCount: 3,
                productsCount: 27
            };

            // Update DOM elements
            const totalSpentEl = document.getElementById('totalSpent');
            const monthlyGoalEl = document.getElementById('monthlyGoal');
            const totalSavingsEl = document.getElementById('totalSavings');
            const marketsCountEl = document.getElementById('marketsCount');
            const productsCountEl = document.getElementById('productsCount');

            if (totalSpentEl) totalSpentEl.textContent = this.formatCurrency(stats.totalSpent);
            if (monthlyGoalEl) monthlyGoalEl.textContent = this.formatCurrency(stats.monthlyGoal);
            if (totalSavingsEl) totalSavingsEl.textContent = this.formatCurrency(stats.totalSavings);
            if (marketsCountEl) marketsCountEl.textContent = stats.marketsCount;
            if (productsCountEl) productsCountEl.textContent = stats.productsCount + ' produtos';

            // Calculate progress indicators
            const spentPercentage = stats.monthlyGoal > 0 ? (stats.totalSpent / stats.monthlyGoal * 100).toFixed(1) : 0;
            const goalProgressEl = document.getElementById('goalProgress');
            const spentChangeEl = document.getElementById('spentChange');
            const savingsChangeEl = document.getElementById('savingsChange');

            if (goalProgressEl) goalProgressEl.textContent = spentPercentage + '% atingido';
            if (spentChangeEl) spentChangeEl.textContent = '+12% este mês';
            if (savingsChangeEl) savingsChangeEl.textContent = '+5% este mês';

        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    async loadRecentPurchases() {
        const container = document.getElementById('recentPurchases');
        if (!container) return;
        
        try {
            // TODO: Integrate with purchaseRecordService to get real data
            const purchases = [
                { category: 'Alimentação', amount: 87.50, date: '2024-01-15', market: 'Supermercado ABC' },
                { category: 'Limpeza', amount: 34.20, date: '2024-01-14', market: 'Mercado XYZ' },
                { category: 'Higiene', amount: 25.80, date: '2024-01-13', market: 'Farmácia 123' }
            ];

            if (purchases.length === 0) {
                container.innerHTML = `
                    <div class="empty-state-sm">
                        <span>🛒</span>
                        <p>Nenhuma compra recente</p>
                    </div>
                `;
                return;
            }

            const purchasesHTML = purchases.map(purchase => `
                <div class="recent-item">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-medium text-sm">${purchase.category}</div>
                            <div class="text-xs text-neutral-500">${purchase.market}</div>
                            <div class="text-xs text-neutral-400">${this.formatDate(purchase.date)}</div>
                        </div>
                        <div class="font-bold text-sm text-primary-600">
                            ${this.formatCurrency(purchase.amount)}
                        </div>
                    </div>
                </div>
            `).join('');

            container.innerHTML = purchasesHTML;
        } catch (error) {
            container.innerHTML = '<p class="text-error-600 text-sm">Erro ao carregar compras</p>';
        }
    }

    async loadTopMarkets() {
        const container = document.getElementById('topMarkets');
        if (!container) return;
        
        try {
            // TODO: Integrate with marketService to get real data
            const markets = [
                { name: 'Supermercado ABC', purchases: 12, totalSpent: 456.80 },
                { name: 'Mercado XYZ', purchases: 8, totalSpent: 234.50 },
                { name: 'Farmácia 123', purchases: 5, totalSpent: 156.20 }
            ];

            if (markets.length === 0) {
                container.innerHTML = `
                    <div class="empty-state-sm">
                        <span>🏪</span>
                        <p>Nenhum mercado cadastrado</p>
                    </div>
                `;
                return;
            }

            const marketsHTML = markets.map(market => `
                <div class="recent-item">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-medium text-sm">${market.name}</div>
                            <div class="text-xs text-neutral-500">${market.purchases} compras</div>
                        </div>
                        <div class="font-bold text-sm text-success-600">
                            ${this.formatCurrency(market.totalSpent)}
                        </div>
                    </div>
                </div>
            `).join('');

            container.innerHTML = marketsHTML;
        } catch (error) {
            container.innerHTML = '<p class="text-error-600 text-sm">Erro ao carregar mercados</p>';
        }
    }

    async loadBestDeals() {
        const container = document.getElementById('bestDeals');
        if (!container) return;
        
        try {
            // TODO: Integrate with productService to get real deals data
            const deals = [
                { product: 'Arroz 5kg', market: 'Mercado ABC', price: 12.99, discount: 15 },
                { product: 'Óleo de Soja 900ml', market: 'Supermercado XYZ', price: 4.89, discount: 12 },
                { product: 'Açúcar Cristal 1kg', market: 'Mercado 123', price: 3.45, discount: 8 }
            ];

            if (deals.length === 0) {
                container.innerHTML = `
                    <div class="empty-state-sm">
                        <span>🔥</span>
                        <p>Nenhuma oferta disponível</p>
                    </div>
                `;
                return;
            }

            const dealsHTML = deals.map(deal => `
                <div class="recent-item">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-medium text-sm">${deal.product}</div>
                            <div class="text-xs text-neutral-500">${deal.market}</div>
                            <div class="text-xs text-success-600">-${deal.discount}% desconto</div>
                        </div>
                        <div class="font-bold text-sm text-error-600">
                            ${this.formatCurrency(deal.price)}
                        </div>
                    </div>
                </div>
            `).join('');

            container.innerHTML = dealsHTML;
        } catch (error) {
            container.innerHTML = '<p class="text-error-600 text-sm">Erro ao carregar ofertas</p>';
        }
    }

    async loadBudgetProgress() {
        const container = document.getElementById('budgetProgress');
        if (!container) return;
        
        try {
            // TODO: Integrate with budgetService to get real budget data
            const budgets = [
                { category: 'Alimentação', budget: 600, spent: 456.80, percentage: 76.1 },
                { category: 'Limpeza', budget: 150, spent: 89.50, percentage: 59.7 },
                { category: 'Higiene', budget: 100, spent: 67.20, percentage: 67.2 }
            ];

            if (budgets.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 11H7v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9h-2v9H9v-9z"/>
                            <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l.8 1.67c.67-1.25 1.01-2.65 1.01-4.21 0-4.39-3.21-8.06-7.33-8.95z"/>
                        </svg>
                        <h3>Nenhuma meta cadastrada</h3>
                        <p>Defina suas metas de orçamento para acompanhar o progresso</p>
                    </div>
                `;
                return;
            }

            const budgetsHTML = budgets.map(budget => `
                <div class="budget-progress-item">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-medium">${budget.category}</span>
                        <span class="text-sm text-neutral-600">
                            ${this.formatCurrency(budget.spent)} / ${this.formatCurrency(budget.budget)}
                        </span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${this.getProgressColor(budget.percentage)}" 
                             style="width: ${Math.min(budget.percentage, 100)}%"></div>
                    </div>
                    <div class="text-right text-sm mt-1">
                        <span class="${this.getPercentageColor(budget.percentage)}">
                            ${budget.percentage.toFixed(1)}%
                        </span>
                    </div>
                </div>
            `).join('');

            container.innerHTML = budgetsHTML;
        } catch (error) {
            container.innerHTML = '<p class="text-error-600 text-sm">Erro ao carregar progresso das metas</p>';
        }
    }

    updateCategoryChart() {
        const container = document.getElementById('categoryChart');
        if (!container) return;
        
        // TODO: Implement actual chart rendering (Chart.js, D3.js, etc.)
        container.innerHTML = `
            <div class="empty-chart">
                <span>📊</span>
                <p>Gráfico em desenvolvimento</p>
            </div>
        `;
    }

    updateTrendChart() {
        const container = document.getElementById('trendChart');
        if (!container) return;
        
        // TODO: Implement actual chart rendering (Chart.js, D3.js, etc.)
        container.innerHTML = `
            <div class="empty-chart">
                <span>📈</span>
                <p>Gráfico em desenvolvimento</p>
            </div>
        `;
    }

    getProgressColor(percentage) {
        if (percentage <= 70) return 'progress-safe';
        if (percentage <= 90) return 'progress-warning';
        return 'progress-danger';
    }

    getPercentageColor(percentage) {
        if (percentage <= 70) return 'text-success-600';
        if (percentage <= 90) return 'text-warning-600';
        return 'text-error-600';
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        });
    }
}

// Browser compatibility
if (typeof window === 'undefined') {
    module.exports = { DashboardController };
} else {
    window.DashboardController = DashboardController;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new DashboardController();
        });
    } else {
        new DashboardController();
    }
}
