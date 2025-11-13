class MarketController {
    constructor() {
        this.markets = [];
        this.bindEvents();
        this.initialize();
    }

    bindEvents() {
        // Search market by CNPJ
        const searchBtn = document.getElementById('buscarMercado');
        if (searchBtn) {
            searchBtn.addEventListener('click', this.searchMarketByCNPJ.bind(this));
        }

        // Market form submission
        const marketForm = document.getElementById('mercadoForm');
        if (marketForm) {
            marketForm.addEventListener('submit', this.handleMarketSubmit.bind(this));
        }
    }

    async searchMarketByCNPJ() {
        const cnpjInput = document.getElementById('mercadoCNPJ');
        const mercadoCNPJ = cnpjInput?.value.trim();

        if (!mercadoCNPJ) {
            showMessage('Por favor, digite um CNPJ.', 'error');
            return;
        }

        // Validate CNPJ format
        if (!/^\d{14}$/.test(mercadoCNPJ)) {
            showMessage('CNPJ deve ter 14 dígitos.', 'error');
            return;
        }

        showMessage('', 'loading');

        try {
            // Make API call to search company by CNPJ
            const response = await fetch(`/.netlify/functions/get-company-cnpj?cnpj=${mercadoCNPJ}`);
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();

            if (!result || result.situacao_cadastral !== 2) {
                showMessage('Mercado não encontrado ou CNPJ inválido.', 'error');
                return;
            }

            // Auto-fill form fields
            this.fillMarketForm(result);
            showMessage('Mercado encontrado e campos preenchidos automaticamente!', 'success');
        } catch (error) {
            console.error('Erro ao buscar mercado:', error);
            showMessage('Erro ao buscar mercado. Tente novamente.', 'error');
        }
    }

    fillMarketForm(companyData) {
        const nameField = document.getElementById('mercadoNome');
        const fantasyField = document.getElementById('nomeFantasia');
        const addressField = document.getElementById('mercadoEndereco');

        if (nameField) nameField.value = companyData.razao_social;
        if (fantasyField) fantasyField.value = companyData.nome_fantasia;
        if (addressField) {
            const address = `${companyData.descricao_tipo_de_logradouro}, ${companyData.logradouro}, ${companyData.numero}, ${companyData.bairro}, ${companyData.municipio}, ${companyData.uf}`;
            addressField.value = address;
        }
    }

    async handleMarketSubmit(e) {
        e.preventDefault();
        
        const nome = document.getElementById('mercadoNome')?.value;
        const endereco = document.getElementById('mercadoEndereco')?.value;
        const cnpj = document.getElementById('mercadoCNPJ')?.value;

        if (!nome || !endereco) {
            showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        try {
            // Make API call to create market
            const response = await fetch('/.netlify/functions/create-markets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nome, endereco, cnpj })
            });
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Clear form
            e.target.reset();
            
            // Update lists
            this.updateMarketsList();
            this.updateMarketSelects();
            
            // Show success message
            showNotification('Mercado cadastrado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao salvar mercado:', error);
            showNotification('Erro ao cadastrar mercado. Tente novamente.', 'error');
        }
    }

    async updateMarketsList() {
        console.log('MarketController: updateMarketsList iniciado');
        try {
            // Make API call to get markets
            const response = await fetch('/.netlify/functions/get-markets');
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            const markets = await response.json();
            console.log('MarketController: markets recebidos da API:', markets);
            this.markets = Array.isArray(markets) ? markets : [];

            const container = document.getElementById('mercadosList');
            if (!container) {
                console.error('MarketController: elemento #mercadosList não encontrado');
                return;
            }

            if (this.markets.length === 0) {
                console.log('MarketController: nenhum mercado encontrado, exibindo estado vazio');
                container.innerHTML = `
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v12z"/>
                        </svg>
                        <h3>Nenhum mercado cadastrado</h3>
                        <p>Cadastre o primeiro mercado para começar</p>
                    </div>
                `;
                return;
            }
            
            console.log('MarketController: renderizando', this.markets.length, 'mercados');
            const htmlContent = this.markets.map(mercado => {
                console.log('MarketController: renderizando mercado:', mercado);
                return `
                <div class="item-card">
                    <h3>${mercado.nome || mercado.name || 'Nome não informado'}</h3>
                    <p><strong>ID:</strong> ${mercado.id || 'N/A'}</p>
                    <p><strong>Endereço:</strong> ${mercado.endereco || mercado.address || 'Endereço não informado'}</p>
                    <p><strong>CNPJ:</strong> ${mercado.cnpj || 'N/A'}</p>
                    <div class="category-badge">Mercado</div>
                </div>
            `;
            }).join('');
            
            console.log('MarketController: HTML gerado:', htmlContent);
            container.innerHTML = htmlContent;
            console.log('MarketController: HTML inserido no DOM');

        } catch (error) {
            console.error('Erro ao atualizar lista de mercados:', error);
            showMessage('Erro ao carregar mercados.', 'error');
        }
    }

    updateMarketSelects() {
        // Update all market selects in the application
        if (typeof window !== 'undefined' && window.updateMercadoSelect) {
            window.updateMercadoSelect();
        }
    }

    async initialize() {
        console.log('MarketController: initialize iniciado');
        try {
            await this.updateMarketsList();
            console.log('MarketController: initialize concluído com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar página de mercados:', error);
        }
    }
}

// Browser compatibility
if (typeof window === 'undefined') {
    module.exports = { MarketController };
} else {
    window.MarketController = MarketController;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const marketController = new MarketController();
            marketController.initialize();
        });
    } else {
        const marketController = new MarketController();
        marketController.initialize();
    }
}
