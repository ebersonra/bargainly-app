class PurchaseController {
    constructor() {
        this.bindEvents();
        this.initialize();
    }

    bindEvents() {
        const purchaseForm = document.getElementById('purchaseForm');
        if (purchaseForm) {
            purchaseForm.addEventListener('submit', this.handlePurchaseSubmit.bind(this));
        }

        // Refresh button for recent purchases
        const refreshBtn = document.getElementById('refreshPurchases');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.loadRecentPurchases.bind(this));
        }
    }

    async handlePurchaseSubmit(e) {
        e.preventDefault();
        
        // Get form data
        const amount = Number(document.getElementById('purchaseAmount')?.value);
        const category = document.getElementById('purchaseCategory')?.value;
        const date = document.getElementById('purchaseDate')?.value;

        // Validation
        if (!amount || amount <= 0) {
            showNotification('Por favor, insira um valor válido.', 'error');
            return;
        }

        if (!category) {
            showNotification('Por favor, selecione uma categoria.', 'error');
            return;
        }

        if (!date) {
            showNotification('Por favor, selecione uma data.', 'error');
            return;
        }

        try {
            console.log('Registrando compra...');
            
            const userId = typeof window !== 'undefined' && window.getUserId ? 
                await window.getUserId() : null;
                
            if (!userId) {
                throw new Error('Usuário não autenticado');
            }
            
            const response = await fetch('/.netlify/functions/insert-purchase-record', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    user_id: userId, 
                    amount, 
                    category, 
                    date 
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            // Clear form on success
            e.target.reset();
            
            // Set current date again
            this.setCurrentDate();
            
            console.log('Compra registrada com sucesso!', result);
            showNotification('Compra registrada com sucesso!', 'success');
            
            // Reload recent purchases list
            this.loadRecentPurchases();
            
        } catch (error) {
            console.error('Erro ao registrar compra:', error);
            showNotification('Erro ao registrar compra. Tente novamente.', 'error');
        }
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('purchaseDate');
        if (dateInput) {
            dateInput.value = today;
        }
    }

    async loadRecentPurchases() {
        const container = document.getElementById('recentPurchasesList');
        if (!container) return;

        try {
            // Show loading state
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Carregando compras...</p>
                </div>
            `;

            const userId = typeof window !== 'undefined' && window.getUserId ? 
                await window.getUserId() : null;

            if (!userId) {
                throw new Error('Usuário não identificado');
            }

            // Get recent purchases from the service
            const purchases = await this.fetchRecentPurchases(userId);
            this.displayRecentPurchases(purchases);

        } catch (error) {
            console.error('Erro ao carregar compras recentes:', error);
            container.innerHTML = `
                <div class="error-state">
                    <p class="text-error-600">Erro ao carregar compras: ${error.message}</p>
                    <button onclick="window.location.reload()" class="btn btn-secondary btn-sm mt-2">
                        Tentar novamente
                    </button>
                </div>
            `;
        }
    }

    async fetchRecentPurchases(userId) {
        try {
            // Try to use existing API endpoint
            const response = await fetch(`/.netlify/functions/get-purchase-records?user_id=${userId}&limit=10`);
            
            if (response.ok) {
                const data = await response.json();
                return Array.isArray(data) ? data : [];
            } else {
                // Fallback: return empty array if endpoint doesn't exist yet
                console.warn('Purchase records endpoint not available yet');
                return [];
            }
        } catch (error) {
            console.warn('Error fetching purchase records:', error);
            return [];
        }
    }

    displayRecentPurchases(purchases) {
        const container = document.getElementById('recentPurchasesList');
        if (!container) return;
        
        if (purchases.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    <h3>Nenhuma compra registrada</h3>
                    <p>Registre sua primeira compra para começar</p>
                </div>
            `;
            return;
        }

        const purchasesHTML = purchases.map(purchase => {
            const formattedAmount = this.formatCurrency(purchase.amount || purchase.value);
            const formattedDate = this.formatDate(purchase.purchase_date || purchase.date || purchase.created_at);
            
            return `
                <div class="purchase-item mb-4 p-4 bg-neutral-50 rounded-lg">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-semibold text-lg">${purchase.category}</h4>
                            <p class="text-sm text-neutral-600">${formattedDate}</p>
                            ${purchase.market ? `<p class="text-sm text-neutral-500">📍 ${purchase.market}</p>` : ''}
                            ${purchase.description ? `<p class="text-sm text-neutral-600 mt-1">${purchase.description}</p>` : ''}
                        </div>
                        <div class="text-right">
                            <span class="text-xl font-bold text-primary-600">
                                ${formattedAmount}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = purchasesHTML;
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    formatDate(dateString) {
        if (!dateString) return 'Data não informada';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    async initialize() {
        try {
            // Populate market select
            if (typeof window !== 'undefined' && window.populateMarketSelect) {
                window.populateMarketSelect('purchaseMarket');
            }
            
            // Populate category select with user's categories from database
            if (typeof window !== 'undefined' && window.populatePurchaseCategorySelect) {
                await window.populatePurchaseCategorySelect('purchaseCategory');
            }
        } catch (error) {
            console.error('Erro ao inicializar página de compras:', error);
        }
    }
}

// Browser compatibility
if (typeof window === 'undefined') {
    module.exports = { PurchaseController };
} else {
    window.PurchaseController = PurchaseController;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const purchaseController = new PurchaseController();
            purchaseController.initialize();
        });
    } else {
        const purchaseController = new PurchaseController();
        purchaseController.initialize();
    }
}
