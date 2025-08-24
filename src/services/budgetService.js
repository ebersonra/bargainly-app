const { budgetRepository } = require('../repositories/purchaseRecordRepository');
const { getUserId } = require('../utils/auth');

class BudgetService {
    async getBudgetStatus() {
        try {
            const userId = await getUserId();
            if (!userId) {
                throw new Error('Usuário não identificado');
            }

            const response = await fetch(`/.netlify/functions/get-budget-status?user_id=${userId}`);
            
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
