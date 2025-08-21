// Home page controller
class HomeController extends BaseController {
    constructor() {
        super();
        this.init();
    }

    init() {
        this.loadHomeData();
        this.checkFirstTime();
    }

    async loadHomeData() {
        try {
            await Promise.all([
                this.loadRecentPurchases(),
                this.loadBestDeals()
            ]);
        } catch (error) {
            console.error('Erro ao carregar dados da home:', error);
        }
    }

    async loadRecentPurchases() {
        const container = document.getElementById('homeRecentPurchases');
        
        try {
            // Simulate recent purchases for demo
            const purchases = []; // Empty for first time

            if (purchases.length === 0) {
                container.innerHTML = `
                    <div class="empty-state-sm">
                        <span>🛒</span>
                        <p>Nenhuma compra recente</p>
                        <a href="/purchase.html" class="btn btn-primary btn-sm mt-3">Registrar primeira compra</a>
                    </div>
                `;
                return;
            }

            // Display purchases...
        } catch (error) {
            container.innerHTML = '<p class="text-error-600 text-sm">Erro ao carregar compras</p>';
        }
    }

    async loadBestDeals() {
        const container = document.getElementById('homeBestDeals');
        
        try {
            // Simulate best deals for demo
            const deals = []; // Empty for first time

            if (deals.length === 0) {
                container.innerHTML = `
                    <div class="empty-state-sm">
                        <span>🔥</span>
                        <p>Nenhuma oferta disponível</p>
                        <a href="/products.html" class="btn btn-primary btn-sm mt-3">Cadastrar produtos</a>
                    </div>
                `;
                return;
            }

            // Display deals...
        } catch (error) {
            container.innerHTML = '<p class="text-error-600 text-sm">Erro ao carregar ofertas</p>';
        }
    }

    checkFirstTime() {
        // Check if user has any data and show/hide getting started guide
        const userId = this.getUserIdFromCookie();
        if (userId) {
            // For now, always show the getting started guide
            // In a real app, you'd check if they have markets, products, etc.
            const gettingStartedCard = document.getElementById('gettingStartedCard');
            if (gettingStartedCard) {
                gettingStartedCard.style.display = 'block';
            }
        }
    }
}

// Initialize home controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HomeController();
});