class BudgetController {
    constructor() {
        this.budgets = [];
        this.bindEvents();
        this.initialize();
    }

    bindEvents() {
        const budgetForm = document.getElementById('budgetForm');
        if (budgetForm) {
            budgetForm.addEventListener('submit', this.handleBudgetSubmit.bind(this));
        }
    }

    async loadBudgets() {
        try {
            const userId = this.getUserId();
            if (!userId) {
                throw new Error('Usuário não autenticado');
            }

            const response = await fetch(`/.netlify/functions/get-budget-status?user_id=${userId}`);
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const budgets = await response.json();
            this.budgets = budgets;

            const list = document.getElementById('budgetsList');
            if (!list) return;

            list.innerHTML = '';

            if (!Array.isArray(budgets) || budgets.length === 0) {
                list.innerHTML = '<p>Nenhuma meta cadastrada</p>';
                return;
            }
            
            budgets.forEach(budget => {
                const item = document.createElement('div');
                item.className = 'budget-item';

                const bar = document.createElement('div');
                bar.className = 'budget-bar';
                bar.style.width = Math.min(budget.percentage, 100) + '%';
                
                // Color coding based on budget status
                if (budget.alert === 'near limit') bar.style.background = '#ecc94b';
                if (budget.alert === 'limit exceeded') bar.style.background = '#e53e3e';
                
                item.innerHTML = `<strong>${budget.category}</strong>: R$${budget.spent} / R$${budget.limit}`;
                
                const container = document.createElement('div');
                container.className = 'budget-bar-container';
                container.appendChild(bar);
                item.appendChild(container);
                list.appendChild(item);
            });
        } catch (error) {
            console.error('Erro ao carregar orçamentos:', error);
            showNotification('Erro ao carregar metas de orçamento.', 'error');
        }
    }

    async handleBudgetSubmit(e) {
        e.preventDefault();
        
        const category = document.getElementById('budgetCategory')?.value;
        const limit = Number(document.getElementById('budgetLimit')?.value);

        if (!category) {
            showNotification('Por favor, selecione uma categoria.', 'error');
            return;
        }

        if (!limit || limit <= 0) {
            showNotification('Por favor, insira um valor válido para o limite.', 'error');
            return;
        }

        try {
            await this.budgetService.setBudget({ category, limit });
            
            // Clear form
            e.target.reset();
            
            // Reload budgets
            await this.loadBudgets();
            
            showNotification('Meta de orçamento definida com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao salvar meta:', error);
            showNotification('Erro ao salvar meta. Tente novamente.', 'error');
        }
    }

    async initialize() {
        try {
            // Populate category select if it exists
            if (typeof window !== 'undefined' && window.populateCategorySelect) {
                window.populateCategorySelect('budgetCategory', false);
            }
            
            // Load existing budgets
            await this.loadBudgets();
        } catch (error) {
            console.error('Erro ao inicializar página de orçamentos:', error);
        }
    }

    getUserId() {
        if (typeof window !== 'undefined' && window.getUserId) {
            return window.getUserId();
        }
        
        // Fallback to cookie parsing
        const userCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('user_id='));
        return userCookie ? userCookie.split('=')[1] : null;
    }
}

// Browser compatibility
if (typeof window === 'undefined') {
    module.exports = { BudgetController };
} else {
    window.BudgetController = BudgetController;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const budgetController = new BudgetController();
            budgetController.initialize();
        });
    } else {
        const budgetController = new BudgetController();
        budgetController.initialize();
    }
}
