const { getUserId } = require('../utils/auth');

class BudgetService {
    async getBudgetStatus(options = {}) {
        try {
            const userId = await getUserId();
            if (!userId) {
                throw new Error('Usuário não identificado');
            }

            // Construir query parameters
            const queryParams = new URLSearchParams({ user_id: userId });
            
            if (options.startDate) {
                queryParams.append('startDate', options.startDate);
            }
            
            if (options.endDate) {
                queryParams.append('endDate', options.endDate);
            }
            
            if (options.category) {
                queryParams.append('category', options.category);
            }

            const response = await fetch(`/.netlify/functions/get-budget-status?${queryParams.toString()}`);
            
            if (!response.ok) {
                throw new Error('Falha ao carregar metas');
            }

            const budgets = await response.json();
            return Array.isArray(budgets) ? budgets : [];
            
        } catch (error) {
            console.error('Erro ao buscar status do orçamento:', error);
            throw error;
        }
    }

    async getBudgetStatusForCurrentMonth() {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        
        return this.getBudgetStatus({ startDate, endDate });
    }

    async getBudgetStatusForPeriod(startDate, endDate) {
        if (!startDate || !endDate) {
            throw new Error('Data de início e fim são obrigatórias');
        }
        
        return this.getBudgetStatus({ startDate, endDate });
    }

    async getBudgetStatusForCategory(category, options = {}) {
        if (!category) {
            throw new Error('Categoria é obrigatória');
        }
        
        return this.getBudgetStatus({ ...options, category });
    }

    async setBudget({ category, limit }) {
        try {
            const userId = await getUserId();
            if (!userId) {
                throw new Error('Usuário não identificado');
            }

            if (!category || !limit || limit <= 0) {
                throw new Error('Categoria e limite são obrigatórios');
            }

            const response = await fetch('/.netlify/functions/set-budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, category, limit })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ao salvar meta: ${errorText}`);
            }

            return await response.json();
            
        } catch (error) {
            console.error('Erro ao definir orçamento:', error);
            throw error;
        }
    }

    validateBudgetData({ category, limit }) {
        const errors = [];

        if (!category || typeof category !== 'string' || category.trim().length === 0) {
            errors.push('Categoria é obrigatória');
        }

        if (!limit || typeof limit !== 'number' || limit <= 0) {
            errors.push('Limite deve ser um número maior que zero');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    formatBudgetDisplay(budget) {
        if (!budget) return null;

        return {
            category: budget.category,
            limit: budget.limit,
            spent: budget.spent || 0,
            remaining: budget.limit - (budget.spent || 0),
            percentage: budget.limit > 0 ? ((budget.spent || 0) / budget.limit * 100) : 0,
            status: this.getBudgetStatus(budget)
        };
    }

    getBudgetStatus(budget) {
        const percentage = budget.limit > 0 ? ((budget.spent || 0) / budget.limit * 100) : 0;
        
        if (percentage >= 100) return 'exceeded';
        if (percentage >= 90) return 'warning';
        if (percentage >= 70) return 'caution';
        return 'normal';
    }

    // Métodos utilitários para períodos comuns
    getDateRangeOptions() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        return {
            thisMonth: {
                startDate: new Date(currentYear, currentMonth, 1).toISOString().slice(0, 10),
                endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().slice(0, 10),
                label: 'Este mês'
            },
            lastMonth: {
                startDate: new Date(currentYear, currentMonth - 1, 1).toISOString().slice(0, 10),
                endDate: new Date(currentYear, currentMonth, 0).toISOString().slice(0, 10),
                label: 'Mês passado'
            },
            last3Months: {
                startDate: new Date(currentYear, currentMonth - 3, 1).toISOString().slice(0, 10),
                endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().slice(0, 10),
                label: 'Últimos 3 meses'
            },
            thisYear: {
                startDate: new Date(currentYear, 0, 1).toISOString().slice(0, 10),
                endDate: new Date(currentYear, 11, 31).toISOString().slice(0, 10),
                label: 'Este ano'
            }
        };
    }

    // Validar formato de data
    isValidDateFormat(dateString) {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) return false;
        
        const date = new Date(dateString);
        return date.toISOString().slice(0, 10) === dateString;
    }
}

// Create singleton instance
const budgetService = new BudgetService();

// Browser compatibility
if (typeof window === 'undefined') {
    // Node.js environment
    module.exports = { BudgetService, budgetService };
} else {
    // Browser environment
    window.BudgetService = BudgetService;
    window.budgetService = budgetService;
}
