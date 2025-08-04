// Armazenamento de dados
let mercados = [];
let produtos = [];

// Navegação entre tabs
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'barganha') {
        updateBarganha();
    }
}

document.getElementById('buscarMercado').addEventListener('click', async function() {
    const mercadoCNPJ = document.getElementById('mercadoCNPJ').value.trim();

    if (!mercadoCNPJ) {
        showMessage('Por favor, digite um CNPJ.', 'error');
        return;
    }

    // Validar formato CNPJ
    if (!/^\d{14}$/.test(mercadoCNPJ)) {
        showMessage('CNPJ deve ter 14 dígitos.', 'error');
        return;
    }

    showMessage('', 'loading');

    try {
        // Buscar na API ReceitaWS
        const endpoint = `/.netlify/functions/get-company-cnpj?cnpj=${mercadoCNPJ}`;

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar mercado');
        }

        const result = await response.json();

        if (!result || result.situacao_cadastral !== 2) {
            showMessage('Mercado não encontrado ou CNPJ inválido.', 'error');
            return;
        }

        // Preencher campos automaticamente
        document.getElementById('mercadoNome').value = result.razao_social;
        document.getElementById('nomeFantasia').value = result.nome_fantasia;
        document.getElementById('mercadoEndereco').value = result.descricao_tipo_de_logradouro + ', ' + result.logradouro + ', ' + result.numero + ', ' + result.bairro + ', ' + result.municipio + ', ' + result.uf;

        showMessage('Mercado encontrado e campos preenchidos automaticamente!', 'success');
    } catch (error) {
        console.error('Erro ao buscar mercado:', error);
        showMessage('Erro ao buscar mercado. Tente novamente.', 'error');
    }
});

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
            thumbnail: result.thumbnail,
            barcode_image: result.barcode_image,
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
        if(!barcode_image){
            barcode_image = 'static/img/products/prod_ind_v4.webp';
            data.barcode_image = barcode_image;
        }
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

function verificaCategoria(category) {
    return category.description === 'Outros';
}

function buscarPorGTIN(listaGTINs, gtinProcurado) {
    if (!Array.isArray(listaGTINs)) {
      console.error('A lista informada não é válida.');
      return null;
    }
  
    const resultado = listaGTINs.find(item => item.gtin === gtinProcurado);
  
    return resultado || null;
}
  
function extrairDadosGTINs(data) {
    if (!data || !Array.isArray(data)) {
      console.error('Formato inválido. Esperado um objeto com a propriedade "gtins" como array.');
      return [];
    }
  
    return data.map(item => {
      return {
        gtin: item.gtin,
        type_packaging: item.commercial_unit?.type_packaging || null,
        quantity_packaging: item.commercial_unit?.quantity_packaging || null,
        ballast: item.commercial_unit?.ballast || null,
        layer: item.commercial_unit?.layer || null
      };
    });
}
  
// Função para mostrar mensagens
function showMessage(message, type) {
    const loadingEl = document.getElementById('loadingMessage');
    const successEl = document.getElementById('successMessage');
    const errorEl = document.getElementById('errorMessage');
    
    // Ocultar todas as mensagens
    if(loadingEl){
        loadingEl.style.display = 'none';
    }

    if(successEl){
        successEl.style.display = 'none';
    }

    if(errorEl) {
        errorEl.style.display = 'none';
    }
    
    if (type === 'loading') {
        loadingEl.style.display = 'block';
    } else if (type === 'success' && message) {
        successEl.textContent = message;
        successEl.style.display = 'block';
        setTimeout(() => successEl.style.display = 'none', 5000);
    } else if (type === 'error' && message) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        setTimeout(() => errorEl.style.display = 'none', 5000);
    }
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

// Função para determinar categoria
function determinarCategoria(category, description) {
    const desc = description.toLowerCase();
    
    const categorias = {
        'Bebidas': [
          'refrigerante', 'suco', 'água', 'cerveja', 'bebida',
          'coca', 'pepsi', 'guaraná', 'soda', 'energético', 'chá'
        ],
        'Laticínios': [
          'leite', 'queijo', 'iogurte', 'manteiga', 'requeijão',
          'creme de leite', 'nata', 'leite condensado', 'bebida láctea'
        ],
        'Carnes e Frios': [
          'carne', 'frango', 'peixe', 'linguiça', 'salsicha',
          'presunto', 'mortadela', 'bacon', 'filé', 'tilápia', 'peito de frango'
        ],
        'Cereais e Grãos': [
          'arroz', 'feijão', 'lentilha', 'grão de bico', 'quinoa',
          'milho', 'soja', 'cereal', 'aveia', 'granola', 'trigo'
        ],
        'Massas e Pães': [
          'macarrão', 'espaguete', 'massa', 'lasanha', 'pão',
          'hambúrguer', 'hot dog', 'wrap', 'tortilla', 'massa fresca'
        ],
        'Padaria': [
          'pão francês', 'pão integral', 'pão australiano', 'pão de forma',
          'pão doce', 'croissant', 'bolo', 'broa', 'rosca', 'massa folhada'
        ],
        'Molhos e Condimentos': [
          'extrato de tomate', 'molho de tomate', 'ketchup', 'maionese',
          'mostarda', 'pimenta', 'barbecue', 'molho shoyu', 'vinagre', 'azeite'
        ],
        'Enlatados e Conservas': [
          'extrato', 'tomate pelado', 'milho verde', 'ervilha', 'sardinha',
          'atum', 'seleta', 'palmito', 'champignon', 'feijoada enlatada'
        ],
        'Higiene': [
          'sabonete', 'shampoo', 'condicionador', 'pasta de dente',
          'escova', 'desodorante', 'absorvente', 'creme dental', 'lenço umedecido'
        ],
        'Limpeza': [
          'detergente', 'sabão', 'amaciante', 'desinfetante',
          'álcool', 'água sanitária', 'multiuso', 'esponja', 'lustra móveis'
        ],
        'Frutas': [
          'maçã', 'banana', 'laranja', 'uva', 'mamão',
          'abacaxi', 'manga', 'kiwi', 'melancia', 'melão', 'fruta'
        ],
        'Verduras e Legumes': [
          'alface', 'rúcula', 'agrião', 'espinafre', 'brócolis',
          'tomate', 'cenoura', 'batata', 'cebola', 'pepino', 'abobrinha', 'berinjela'
        ],
        'Congelados': [
          'lasanha congelada', 'pizza', 'hambúrguer', 'nuggets', 'batata congelada',
          'prato pronto', 'frango empanado', 'sorvete', 'polpa de fruta'
        ],
        'Doces e Sobremesas': [
          'chocolate', 'bombom', 'bala', 'pirulito', 'doce de leite',
          'pudim', 'gelatina', 'sorvete', 'wafer', 'barra de cereal'
        ],
        'Café e Cereais Matinais': [
          'café', 'cappuccino', 'achocolatado', 'nescau', 'toddy', 'cereal matinal'
        ]
      };      
    
    for (const [categoria, palavras] of Object.entries(categorias)) {
        if (palavras.some(palavra => desc.includes(palavra))) {
            return categoria;
        }
    }
    
    return category.description;
}

// Função para determinar unidade baseada na type_packaging
function determinarUnidade(unidade) {
    const desc = unidade.toLowerCase();
    
    if (desc.includes('kg') || desc.includes('kilo')) return 'kg';
    if (desc.includes('g') && !desc.includes('kg')) return 'g';
    if (desc.includes('l') || desc.includes('litro')) return 'l';
    if (desc.includes('ml')) return 'ml';
    if (desc.includes('cx') || desc.includes('caixa')) return 'cx';
    if (desc.includes('pct') || desc.includes('pacote')) return 'pct';
    
    return 'un'; // padrão
}

// Cadastro de mercado
document.getElementById('mercadoForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('mercadoNome').value;
    const endereco = document.getElementById('mercadoEndereco').value;
    const cnpj = document.getElementById('mercadoCNPJ').value;

    // Envia para Supabase via função serverless
    try {
        await fetch('/.netlify/functions/create-markets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, endereco, cnpj })
        });
    } catch (err) {
        console.error('Erro ao salvar mercado no Supabase', err);
    }

    updateMercadosList();
    updateMercadoSelect();
    
    // Limpar formulário
    this.reset();
    
    // Feedback visual
    showNotification('Mercado cadastrado com sucesso!', 'success');
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

// Atualizar lista de mercados
async function updateMercadosList() {
    const container = document.getElementById('mercadosList');

    const response = await fetch('/.netlify/functions/get-markets', {
        method: 'GET',
        headers: { 
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        console.error('Erro ao buscar mercados:', response.statusText);
    }
    const result = await response.json();

    if(!result){
        showMessage('Erro ao buscar mercados na base de dados.', 'error');
        return;
    }
    
    result.map(market => {
        if (!mercados.some(m => m.id === market.id)){
            // Adiciona mercado ao array
            mercados.push({
                id: market.id,
                nome: market.name,
                endereco: market.address,
                cnpj: market.cnpj || null
            });
        }
    });

    if (mercados.length === 0) {
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
    
    container.innerHTML = mercados.map(mercado => `
        <div class="item-card">
            <h3>${mercado.nome}</h3>
            <p><strong>ID:</strong> ${mercado.id}</p>
            <p><strong>Endereço:</strong> ${mercado.endereco}</p>
            <p><strong>CNPJ:</strong> ${mercado.cnpj || 'N/A'}</p>
            <div class="category-badge">Mercado</div>
        </div>
    `).join('');

    updateMercadoSelect();
}

// Atualizar select de mercados
function updateMercadoSelect() {
    const select = document.getElementById('produtoMercado');
    select.innerHTML = '<option value="">Selecione um mercado</option>' +
        mercados.map(mercado => `<option value="${mercado.id}">${mercado.nome} / ${mercado.endereco}</option>`).join('');
}

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

// Atualizar barganha
function updateBarganha() {
    const container = document.getElementById('barganhaList');
    
    if (produtos.length === 0 || mercados.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <h3>Nenhuma barganha disponível</h3>
                <p>Cadastre mercados e produtos para ver as melhores ofertas</p>
            </div>
        `;
        return;
    }

    // Agrupar produtos por nome
    const produtosPorNome = {};
    produtos.forEach(produto => {
        if (!produtosPorNome[produto.nome]) {
            produtosPorNome[produto.nome] = [];
        }
        produtosPorNome[produto.nome].push(produto);
    });

    // Encontrar menor preço para cada produto
    const barganhas = [];
    Object.keys(produtosPorNome).forEach(nomeProduto => {
        const produtosDoTipo = produtosPorNome[nomeProduto];
        const menorPreco = Math.min(...produtosDoTipo.map(p => p.valor));
        const produtoMaisBarato = produtosDoTipo.find(p => p.valor === menorPreco);
        const mercado = mercados.find(m => m.id === produtoMaisBarato.mercadoId);
        
        barganhas.push({
            produto: produtoMaisBarato,
            mercado: mercado,
            outrosPrecos: produtosDoTipo.filter(p => p.valor !== menorPreco)
        });
    });

    // Ordenar por menor preço
    barganhas.sort((a, b) => a.produto.valor - b.produto.valor);

    container.innerHTML = barganhas.map((barganha, index) => `
        <div class="bargain-item">
            <h3>${barganha.produto.nome} ${index === 0 ? '<span class="best-price">MELHOR PREÇO</span>' : ''}</h3>
            <p><strong>Mercado:</strong> ${barganha.mercado.nome}</p>
            <p><strong>Endereço:</strong> ${barganha.mercado.endereco}</p>
            <p><strong>Preço:</strong> <span style="color: #48bb78; font-weight: bold; font-size: 1.2em;">R$ ${barganha.produto.valor.toFixed(2)}/${barganha.produto.unidade}</span></p>
            <p><strong>Categoria:</strong> ${barganha.produto.categoria}</p>
            ${barganha.outrosPrecos.length > 0 ? 
                `<p style="color: #4a5568; font-size: 0.9em; margin-top: 10px;">
                    <strong>Outros preços:</strong> ${barganha.outrosPrecos.map(p => {
                        const m = mercados.find(mercado => mercado.id === p.mercadoId);
                        return `${m.nome}: R$ ${p.valor.toFixed(2)}`;
                    }).join(', ')}
                </p>` : ''
            }
        </div>
    `).join('');
}

// Função para mostrar notificações
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : '#f56565'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 3000);
}

// Inicialização
updateMercadosList();
updateProdutosList();