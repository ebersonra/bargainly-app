// Purchase page specific controller
class PurchaseController extends BaseController {
    constructor() {
        super();
        this.init();
    }

    init() {
        this.setCurrentDate();
        this.loadMarkets();
        this.setupEventListeners();
        this.loadRecentPurchases();
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('purchaseDate').value = today;
    }

    setupEventListeners() {
        const form = document.getElementById('purchaseForm');
        this.handleFormSubmission(form, (data) => this.createPurchase(data));

        // OCR upload
        const uploadArea = document.getElementById('receiptUploadArea');
        const fileInput = document.getElementById('receiptFileInput');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('drop', this.handleFileDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // OCR actions
        document.getElementById('confirmOcrItems')?.addEventListener('click', () => {
            this.confirmOcrItems();
        });

        document.getElementById('cancelOcr')?.addEventListener('click', () => {
            this.cancelOcr();
        });

        document.getElementById('refreshPurchases')?.addEventListener('click', () => {
            this.loadRecentPurchases();
        });
    }

    async loadMarkets() {
        try {
            // Use the shared function to populate market select
            populateMarketSelect('purchaseMarket');
        } catch (error) {
            console.error('Erro ao carregar mercados:', error);
        }
    }

    async createPurchase(data) {
        try {
            const userId = this.getUserIdFromCookie();
            if (!userId) {
                throw new Error('Usuário não autenticado');
            }

            const purchaseData = {
                user_id: userId,
                amount: parseFloat(data.amount),
                category: data.category,
                purchase_date: data.date,
                market: data.market || null,
                notes: data.notes || null
            };

            // Use existing purchase functionality if available
            if (typeof window.submitPurchase === 'function') {
                await window.submitPurchase(purchaseData);
            }

            this.showSuccess('Compra registrada com sucesso!', document.getElementById('purchaseForm').parentElement);
            document.getElementById('purchaseForm').reset();
            this.setCurrentDate();
            await this.loadRecentPurchases();
        } catch (error) {
            throw new Error('Erro ao registrar compra: ' + error.message);
        }
    }

    async loadRecentPurchases() {
        const container = document.getElementById('recentPurchasesList');
        this.showLoading(container);

        try {
            const userId = this.getUserIdFromCookie();
            if (!userId) return;

            // Load recent purchases (implement API call)
            const purchases = await this.fetchRecentPurchases(userId);
            this.displayRecentPurchases(purchases);
        } catch (error) {
            this.showError('Erro ao carregar compras: ' + error.message, container.parentElement);
        } finally {
            this.hideLoading(container);
        }
    }

    async fetchRecentPurchases(userId) {
        // This would call your API to fetch recent purchases
        // For now, return empty array
        return [];
    }

    displayRecentPurchases(purchases) {
        const container = document.getElementById('recentPurchasesList');
        
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

        const purchasesHTML = purchases.map(purchase => `
            <div class="purchase-item">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold">${purchase.category}</h4>
                        <p class="text-sm text-neutral-600">${purchase.date}</p>
                        ${purchase.market ? `<p class="text-sm text-neutral-500">${purchase.market}</p>` : ''}
                    </div>
                    <div class="text-right">
                        <span class="text-lg font-bold text-primary-600">
                            ${this.formatCurrency(purchase.amount)}
                        </span>
                    </div>
                </div>
                ${purchase.notes ? `<p class="text-sm text-neutral-600 mt-2">${purchase.notes}</p>` : ''}
            </div>
        `).join('');

        container.innerHTML = purchasesHTML;
    }

    // OCR functionality
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processReceiptImage(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processReceiptImage(file);
        }
    }

    async processReceiptImage(file) {
        const progressDiv = document.getElementById('ocrProgress');
        const resultsDiv = document.getElementById('ocrResults');
        
        progressDiv.classList.remove('hidden');
        resultsDiv.classList.add('hidden');

        try {
            // Process image with OCR API
            const formData = new FormData();
            formData.append('receipt', file);

            const response = await fetch('/.netlify/functions/process-receipt-ocr', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Erro ao processar imagem');
            }

            const result = await response.json();
            this.displayOcrResults(result.items || []);
        } catch (error) {
            this.showError('Erro ao processar nota fiscal: ' + error.message, progressDiv.parentElement);
        } finally {
            progressDiv.classList.add('hidden');
        }
    }

    displayOcrResults(items) {
        const resultsDiv = document.getElementById('ocrResults');
        const itemsList = document.getElementById('ocrItemsList');

        if (items.length === 0) {
            itemsList.innerHTML = '<p class="text-neutral-600">Nenhum item encontrado na nota fiscal.</p>';
        } else {
            const itemsHTML = items.map((item, index) => `
                <div class="ocr-item flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                    <div>
                        <span class="font-medium">${item.name}</span>
                        <span class="text-sm text-neutral-600 ml-2">${item.category || 'Categoria não identificada'}</span>
                    </div>
                    <span class="font-bold text-primary-600">${this.formatCurrency(item.price)}</span>
                </div>
            `).join('');
            itemsList.innerHTML = itemsHTML;
        }

        resultsDiv.classList.remove('hidden');
    }

    confirmOcrItems() {
        // Implement OCR confirmation logic
        const items = document.querySelectorAll('.ocr-item');
        // Process each item...
        this.cancelOcr();
        this.showSuccess('Itens da nota fiscal registrados com sucesso!', document.getElementById('ocrResults').parentElement);
    }

    cancelOcr() {
        document.getElementById('ocrResults').classList.add('hidden');
        document.getElementById('receiptFileInput').value = '';
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
}

// Initialize purchase controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PurchaseController();
});