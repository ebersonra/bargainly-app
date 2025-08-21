// Deals page controller
class DealsController extends BaseController {
    constructor() {
        super();
        this.init();
    }

    async init() {
        try {
            // Populate filter selects
            populateCategorySelect('filterCategory', true);
            populateMarketSelect('filterMarket', true);
            
            // Load deals data
            this.loadDeals();
            
            // Setup event listeners
            this.setupEventListeners();
        } catch (error) {
            console.error('Erro ao inicializar página de ofertas:', error);
        }
    }

    setupEventListeners() {
        document.getElementById('applyFilters')?.addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clearFilters')?.addEventListener('click', () => {
            this.clearFilters();
        });
        
        // Auto-apply filters when they change
        const filterCategory = document.getElementById('filterCategory');
        const filterMarket = document.getElementById('filterMarket');
        const filterMaxPrice = document.getElementById('filterMaxPrice');
        
        if (filterCategory) {
            filterCategory.addEventListener('change', () => this.applyFilters());
        }
        
        if (filterMarket) {
            filterMarket.addEventListener('change', () => this.applyFilters());
        }
        
        if (filterMaxPrice) {
            filterMaxPrice.addEventListener('input', () => this.applyFilters());
        }
    }

    async loadDeals() {
        const container = document.getElementById('barganhaList');
        this.showLoading(container);

        try {
            // This would call the existing barganha functionality
            if (typeof updateBarganha === 'function') {
                await updateBarganha();
            } else {
                // Show empty state if no barganha function available
                container.innerHTML = `
                    <div class="empty-state">
                        <span>🔍</span>
                        <h3>Nenhuma oferta encontrada</h3>
                        <p>Cadastre produtos em diferentes mercados para ver as melhores ofertas</p>
                        <a href="/products.html" class="btn btn-primary mt-3">Cadastrar produtos</a>
                    </div>
                `;
            }
        } catch (error) {
            this.showError('Erro ao carregar ofertas: ' + error.message, container.parentElement);
        } finally {
            this.hideLoading(container);
        }
    }

    applyFilters() {
        const category = document.getElementById('filterCategory').value;
        const market = document.getElementById('filterMarket').value;
        const maxPrice = document.getElementById('filterMaxPrice').value;

        // Apply filters to the deals list
        this.filterDeals({ category, market, maxPrice });
    }

    clearFilters() {
        document.getElementById('filterCategory').value = '';
        document.getElementById('filterMarket').value = '';
        document.getElementById('filterMaxPrice').value = '';
        this.loadDeals();
    }

    filterDeals(filters) {
        // Implementation for filtering deals
        const deals = document.querySelectorAll('#barganhaList .item-card');
        let visibleCount = 0;

        deals.forEach(deal => {
            let visible = true;

            if (filters.category && !deal.dataset.category?.includes(filters.category)) {
                visible = false;
            }

            if (filters.market && !deal.dataset.market?.includes(filters.market)) {
                visible = false;
            }

            if (filters.maxPrice) {
                const price = parseFloat(deal.dataset.price || '0');
                if (price > parseFloat(filters.maxPrice)) {
                    visible = false;
                }
            }

            deal.style.display = visible ? 'block' : 'none';
            if (visible) visibleCount++;
        });

        const offersCountEl = document.getElementById('offersCount');
        if (offersCountEl) {
            offersCountEl.textContent = visibleCount;
        }
    }
}

// Initialize deals controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DealsController();
});