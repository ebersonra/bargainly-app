let produtos = [];

// Buscar produto por código de barras
document.getElementById('buscarProduto').addEventListener('click', async function() {
    const codigoBarras = document.getElementById('codigoBarras').value.trim();
    
    if (!codigoBarras) {
        showMessage('Por favor, digite um código de barras.', 'error');
        return;
    }
    
    // Validar formato GTIN (8, 12, 13, 14 dígitos)
    if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(codigoBarras)) {
        showMessage('Código de barras deve ter 8, 12, 13 ou 14 dígitos.', 'error');
        return;
    }
    
    showMessage('', 'loading');
    
    try {
        // Buscar na API Cosmos Bluesoft
        const endpoint = `/.netlify/functions/bluesoft?codigo=${codigoBarras}`;

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();

        if(!result){
            showMessage('Produto não encontrado na base de dados.', 'error');
            return;
        }

        const gtins = extrairDadosGTINs(result.gtins);
        const gtin = buscarPorGTIN(gtins, result.gtin);
        
        const data = {
            description: result.description,
            gtin: result.gtin,
            origin: result.origin,
            brand: result.brand && result.brand.name ? result.brand.name : undefined,
            ncm: result.ncm && result.ncm.code ? result.ncm.code : undefined,
            type_packaging: gtin ? gtin.type_packaging : 'un',
            thumbnail: result.thumbnail ? result.thumbnail : 'static/img/products/prod_ind_v4.webp',
            barcode_image: result.barcode_image ? result.barcode_image : 'static/img/products/prod_ind_v4.webp',
            category: result.category ? result.category : {description: 'Outros'},
            price: result.price ? parseFloat(result.price) : undefined,
            avg_price: result.avg_price ? parseFloat(result.avg_price) : undefined,
            max_price: result.max_price ? parseFloat(result.max_price) : undefined,
            min_price: result.min_price ? parseFloat(result.min_price) : undefined
        };

        const produtoValor = parseFloat(0.01).toFixed(2);
        if(data.price){
            produtoValor = parseFloat(data.price).toFixed(2);
        }else if(data.avg_price){
            produtoValor = parseFloat(data.avg_price).toFixed(2);
        }
        document.getElementById('produtoValor').value =  produtoValor;

        // Tentar determinar a unidade baseada na type_packaging
        const unidade = determinarUnidade(data.type_packaging);
        document.getElementById('produtoUnidade').value = unidade;

        const thumbnail = data.thumbnail;
        document.getElementById('thumbnail').src = thumbnail;

        const barcode_image = data.barcode_image;
        document.getElementById('barcode').src = barcode_image;

        // Tentar determinar a categoria
        const category = data.category;
        if (category && !verificaCategoria(category)) {
            document.getElementById('produtoCategoria').value = category.description;
        }else{
            let categoryDesc = determinarCategoria(category, data.description);
            document.getElementById('produtoCategoria').value = categoryDesc;
            data.category = {description: categoryDesc}
        }

        // Preencher os campos automaticamente
        document.getElementById('produtoNome').value = data.description;
            
        // Mostrar informações do produto
        showProductInfo(data);
        showMessage('Produto encontrado e campos preenchidos automaticamente!', 'success');
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        showMessage('Erro ao buscar produto. Tente novamente ou preencha manualmente.', 'error');
    }
});

// Cadastro de produto
document.getElementById('produtoForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const mercadoId = document.getElementById('produtoMercado').value;
    const nome = document.getElementById('produtoNome').value;
    const unidade = document.getElementById('produtoUnidade').value;
    const valor = parseFloat(document.getElementById('produtoValor').value);
    const categoria = document.getElementById('produtoCategoria').value;
    const thumbnail = document.getElementById('thumbnail').src;
    const gtin = document.getElementById('codigoBarras').value || null;
    const barcode = document.getElementById('barcode').src;

    if(!mercadoId){
        showNotification('Por favor, selecione um mercado.', 'error');
        return;
    }

    // Envia para Supabase via função serverless
    try {
        await fetch('/.netlify/functions/create-products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mercadoId,
                nome,
                unidade,
                valor,
                categoria,
                gtin,
                thumbnail,
                barcode
            })
        });
    } catch (err) {
        console.error('Erro ao salvar produto no Supabase', err);
    }
    
    // Limpar formulário
    this.reset();
    
    // Feedback visual
    showNotification('Produto cadastrado com sucesso!', 'success');

    updateProdutosList();
});

// Atualizar lista de produtos
async function updateProdutosList() {
    const container = document.getElementById('produtosList');

    const response = await fetch('/.netlify/functions/get-products', {
        method: 'GET',
        headers: { 
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        console.error('Erro ao buscar produtos:', response.statusText);
    }
    const result = await response.json();

    if(!result){
        showMessage('Erro ao buscar produtos na base de dados.', 'error');
        return;
    }

    result.map(product => {
        if (!produtos.some(p => p.id === product.id)){
            // Adiciona produto ao array
            produtos.push({
                id: product.id,
                mercadoId: product.market_id,
                nome: product.name,
                unidade: product.unit,
                valor: product.price,
                categoria: product.category,
                gtin: product.gtin || null,
                thumbnail: product.thumbnail || 'static/img/products/prod_ind_v4.webp',
                barcode: product.barcode || 'static/img/products/prod_ind_v4.webp'
            });
        }
    })
    
    if (produtos.length === 0) {
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
    
    container.innerHTML = produtos.map(produto => {
        const mercado = mercados.find(m => m.id === produto.mercadoId);
        return `
            <div class="item-card">
                <div class="product-container">
                    <img id="thumbnail" class="product-thumbnail-list" src="${produto.thumbnail}" alt="Produto">
                </div>
                <h3>${produto.nome}</h3>
                <p><strong>Mercado:</strong> ${mercado ? mercado.nome : 'N/A'}</p>
                <p><strong>Unidade:</strong> ${produto.unidade}</p>
                ${produto.gtin ? `<p><strong>GTIN:</strong> ${produto.gtin}</p>` : ''}
                <div class="price-tag">R$ ${produto.valor.toFixed(2)}</div>
                <div class="category-badge">${produto.categoria}</div>
                <div class="product-container">
                    <img id="barcode" class="product-barcode-list" src="${produto.barcode}" alt="Barcode">
                </div>
            </div>
        `;
    }).join('');

    // Atualizar barganha após carregar produtos
    updateBarganha();
}

// Função para mostrar informações do produto
function showProductInfo(data) {
    const infoEl = document.getElementById('productInfo');
    if (!infoEl) return;
    let infoHtml = '<h4>📦 Informações do Produto:</h4>';

    if (data.description) infoHtml += `<p><strong>Nome:</strong> ${data.description}</p>`;
    if (data.brand) infoHtml += `<p><strong>Marca:</strong> ${data.brand}</p>`;
    if (data.gtin) infoHtml += `<p><strong>GTIN:</strong> ${data.gtin}</p>`;
    if (data.ncm) infoHtml += `<p><strong>NCM:</strong> ${data.ncm}</p>`;
    if (data.origin) infoHtml += `<p><strong>Origem:</strong> ${data.origin}</p>`;
    if (data.type_packaging) infoHtml += `<p><strong>Tipo Embalagem:</strong> ${data.type_packaging}</p>`;
    if (data.category.description) infoHtml += `<p><strong>Categoria:</strong> ${data.category.description}</p>`;
 
    infoEl.innerHTML = infoHtml;
    infoEl.style.display = 'block';
    setTimeout(() => (infoEl.style.display = 'none'), 10000);
}

// Inicialização
updateProdutosList();