class ProductController {
    constructor() {
        this.products = [];
        this.markets = [];
        this.bindEvents();
        this.initialize();
    }

    bindEvents() {
        // Search product by barcode
        const searchBtn = document.getElementById('buscarProduto');
        if (searchBtn) {
            searchBtn.addEventListener('click', this.searchProductByBarcode.bind(this));
        }

        // Product form submission
        const productForm = document.getElementById('produtoForm');
        if (productForm) {
            productForm.addEventListener('submit', this.handleProductSubmit.bind(this));
        }

        // Barcode scanner button
        const scanBtn = document.getElementById('scanBarcodeBtn');
        if (scanBtn && typeof window !== 'undefined' && window.scanBarcode) {
            scanBtn.addEventListener('click', () => {
                window.scanBarcode((code) => {
                    const barcodeInput = document.getElementById('codigoBarras');
                    if (barcodeInput) {
                        barcodeInput.value = code;
                        this.searchProductByBarcode();
                    }
                });
            });
        }
    }

    async searchProductByBarcode() {
        const barcodeInput = document.getElementById('codigoBarras');
        const codigoBarras = barcodeInput?.value.trim();
        
        if (!codigoBarras) {
            showMessage('Por favor, digite um código de barras.', 'error');
            return;
        }
        
        // Validate GTIN format (8, 12, 13, 14 digits)
        if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(codigoBarras)) {
            showMessage('Código de barras deve ter 8, 12, 13 ou 14 dígitos.', 'error');
            return;
        }
        
        showMessage('', 'loading');
        
        try {
            // Make API call to search product by barcode
            const response = await fetch(`/.netlify/functions/bluesoft?gtin=${codigoBarras}`);
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();

            if (!result) {
                showMessage('Produto não encontrado na base de dados.', 'error');
                return;
            }

            // Fill form with product data
            this.fillProductForm(result);
            this.showProductInfo(result);
            showMessage('Produto encontrado e campos preenchidos automaticamente!', 'success');
        } catch (error) {
            console.error('Erro ao buscar produto:', error);
            showMessage('Erro ao buscar produto. Tente novamente ou preencha manualmente.', 'error');
        }
    }

    fillProductForm(productData) {
        // Fill product name
        const nameField = document.getElementById('produtoNome');
        if (nameField) nameField.value = productData.description;

        // Fill price
        const priceField = document.getElementById('produtoValor');
        if (priceField) {
            let price = 0.01;
            if (productData.price) {
                price = parseFloat(productData.price);
            } else if (productData.avg_price) {
                price = parseFloat(productData.avg_price);
            }
            priceField.value = price.toFixed(2);
        }

        // Fill unit
        const unitField = document.getElementById('produtoUnidade');
        if (unitField && productData.type_packaging) {
            const unit = this.determineUnit(productData.type_packaging);
            unitField.value = unit;
        }

        // Fill category
        const categoryField = document.getElementById('produtoCategoria');
        if (categoryField && productData.category) {
            categoryField.value = productData.category.description || 'Outros';
        }

        // Fill images
        const thumbnailImg = document.getElementById('thumbnail');
        if (thumbnailImg && productData.thumbnail) {
            thumbnailImg.src = productData.thumbnail;
        }

        const barcodeImg = document.getElementById('barcode');
        if (barcodeImg && productData.barcode_image) {
            barcodeImg.src = productData.barcode_image;
        }
    }

    determineUnit(typePackaging) {
        const unitMap = {
            'un': 'unidade',
            'kg': 'kg', 
            'g': 'g',
            'l': 'litro',
            'ml': 'ml',
            'cx': 'caixa',
            'pct': 'pacote'
        };
        return unitMap[typePackaging] || 'unidade';
    }

    showProductInfo(data) {
        const infoEl = document.getElementById('productInfo');
        if (!infoEl) return;

        let infoHtml = '<h4>📦 Informações do Produto:</h4>';
        if (data.description) infoHtml += `<p><strong>Nome:</strong> ${data.description}</p>`;
        if (data.brand) infoHtml += `<p><strong>Marca:</strong> ${data.brand}</p>`;
        if (data.gtin) infoHtml += `<p><strong>GTIN:</strong> ${data.gtin}</p>`;
        if (data.ncm) infoHtml += `<p><strong>NCM:</strong> ${data.ncm}</p>`;
        if (data.origin) infoHtml += `<p><strong>Origem:</strong> ${data.origin}</p>`;
        if (data.type_packaging) infoHtml += `<p><strong>Tipo Embalagem:</strong> ${data.type_packaging}</p>`;
        if (data.category && data.category.description) infoHtml += `<p><strong>Categoria:</strong> ${data.category.description}</p>`;
     
        infoEl.innerHTML = infoHtml;
        infoEl.style.display = 'block';
        setTimeout(() => (infoEl.style.display = 'none'), 10000);
    }

    async handleProductSubmit(e) {
        e.preventDefault();
        
        const marketId = document.getElementById('produtoMercado')?.value;
        const nome = document.getElementById('produtoNome')?.value;
        const unidade = document.getElementById('produtoUnidade')?.value;
        const valor = parseFloat(document.getElementById('produtoValor')?.value);
        const categoria = document.getElementById('produtoCategoria')?.value;
        const thumbnail = document.getElementById('thumbnail')?.src;
        const gtin = document.getElementById('codigoBarras')?.value || null;
        const barcode = document.getElementById('barcode')?.src;

        if (!marketId) {
            showNotification('Por favor, selecione um mercado.', 'error');
            return;
        }

        if (!nome || !unidade || isNaN(valor) || !categoria) {
            showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        try {
            // Make API call to create product
            const response = await fetch('/.netlify/functions/create-products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    marketId,
                    nome,
                    unidade,
                    valor,
                    categoria,
                    gtin,
                    thumbnail,
                    barcode
                })
            });
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Clear form
            e.target.reset();
            
            // Update product list
            this.updateProductsList();
            
            // Show success message
            showNotification('Produto cadastrado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            showNotification('Erro ao cadastrar produto. Tente novamente.', 'error');
        }
    }

    async updateProductsList() {
        try {
            // Make API call to get products
            const response = await fetch('/.netlify/functions/get-products');
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            const products = await response.json();
            this.products = products;

            const container = document.getElementById('produtosList');
            if (!container) return;

            if (products.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 4V2a1 1 0 0 1 2 0v2h6V2a1 1 0 0 1 2 0v2h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1zm0 2H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1v1a1 1 0 0 1-2 0V6H9v1a1 1 0 0 1-2 0V6z"/>
                        </svg>
                        <h3>Nenhum produto cadastrado</h3>
                        <p>Cadastre produtos para aparecerem na barganha</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = products.map(produto => {
                const mercado = this.markets.find(m => m.id === produto.mercadoId);
                return `
                    <div class="item-card">
                        <div class="product-container">
                            <img class="product-thumbnail-list" src="${produto.thumbnail}" alt="Produto">
                        </div>
                        <h3>${produto.nome || 'Nome não informado'}</h3>
                        <p><strong>Mercado:</strong> ${mercado ? mercado.nome : 'N/A'}</p>
                        <p><strong>Unidade:</strong> ${produto.unidade || 'N/A'}</p>
                        ${produto.gtin ? `<p><strong>GTIN:</strong> ${produto.gtin}</p>` : ''}
                        <div class="price-tag">R$ ${produto.valor ? produto.valor.toFixed(2) : '0.00'}</div>
                        <div class="category-badge">${produto.categoria || 'Sem categoria'}</div>
                        <div class="product-container">
                            <img class="product-barcode-list" src="${produto.barcode || ''}" alt="Barcode">
                        </div>
                    </div>
                `;
            }).join('');

            // Update barganha after loading products
            if (typeof window !== 'undefined' && window.updateBarganha) {
                window.updateBarganha();
            }
        } catch (error) {
            console.error('Erro ao atualizar lista de produtos:', error);
            showMessage('Erro ao carregar produtos.', 'error');
        }
    }

    async initialize() {
        try {
            // Load markets for the select
            if (typeof window !== 'undefined' && window.loadMarkets) {
                try {
                    this.markets = await window.loadMarkets();
                    if (window.populateMarketSelect) {
                        window.populateMarketSelect('produtoMercado');
                    }
                } catch (marketError) {
                    console.error('Erro ao carregar mercados:', marketError);
                    this.markets = [];
                }
            }
            
            // Load existing products
            try {
                await this.updateProductsList();
            } catch (productError) {
                console.error('Erro ao carregar produtos:', productError);
            }
        } catch (error) {
            console.error('Erro ao inicializar página de produtos:', error);
        }
    }
}

// Browser compatibility
if (typeof window === 'undefined') {
    module.exports = { ProductController };
} else {
    window.ProductController = ProductController;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const productController = new ProductController();
            productController.initialize();
        });
    } else {
        const productController = new ProductController();
        productController.initialize();
    }
}
