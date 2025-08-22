async function getUserId() {
    // Recupera o valor do cookie 'user_id'
    const match = document.cookie.match(/(?:^|; )user_id=([^;]*)/);
    if (match && match[1]) {
        return decodeURIComponent(match[1]);
    } else {
        console.error('Usuário não autenticado (cookie user_id não encontrado)');
        throw new Error('Usuário não autenticado');
    }
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

// Função para mostrar mensagens
function showMessage(message, type) {
    const loadingEl = document.getElementById('loadingMessage');
    const successEl = document.getElementById('successMessage');
    const errorEl = document.getElementById('errorMessage');
    
    // Ocultar todas as mensagens - remove both hidden class and set display none
    if(loadingEl){
        loadingEl.style.display = 'none';
        loadingEl.classList.add('hidden');
    }

    if(successEl){
        successEl.style.display = 'none';
        successEl.classList.add('hidden');
    }

    if(errorEl) {
        errorEl.style.display = 'none';
        errorEl.classList.add('hidden');
    }
    
    if (type === 'loading' && loadingEl) {
        loadingEl.classList.remove('hidden');
        loadingEl.style.display = 'block';
    } else if (type === 'success' && message && successEl) {
        successEl.textContent = message;
        successEl.classList.remove('hidden');
        successEl.style.display = 'block';
        setTimeout(() => {
            successEl.style.display = 'none';
            successEl.classList.add('hidden');
        }, 5000);
    } else if (type === 'error' && message && errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
        errorEl.style.display = 'block';
        setTimeout(() => {
            errorEl.style.display = 'none';
            errorEl.classList.add('hidden');
        }, 5000);
    }
}

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

// Shared function to load markets
async function loadMarkets() {
    try {
        const response = await fetch('/.netlify/functions/get-markets', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Erro ao buscar mercados:', response.statusText);
            return [];
        }
        
        const result = await response.json();
        
        if (!Array.isArray(result)) {
            console.error('Formato inválido de resposta dos mercados');
            return [];
        }

        return result.map(market => ({
            id: market.id,
            nome: market.name,
            endereco: market.address,
            cnpj: market.cnpj || null
        }));
    } catch (error) {
        console.error('Erro ao carregar mercados:', error);
        return [];
    }
}

// Shared function to populate market select
async function populateMarketSelect(selectId, includeEmpty = true) {
    const select = document.getElementById(selectId);
    if (!select) {
        console.error(`Select element with id '${selectId}' not found`);
        return;
    }

    try {
        const markets = await loadMarkets();
        
        let options = '';
        if (includeEmpty) {
            options += '<option value="">Selecione um mercado</option>';
        }
        
        options += markets.map(market => 
            `<option value="${market.id}">${market.nome} / ${market.endereco}</option>`
        ).join('');
        
        select.innerHTML = options;
    } catch (error) {
        console.error('Erro ao popular select de mercados:', error);
        select.innerHTML = '<option value="">Erro ao carregar mercados</option>';
    }
}

// Shared function to get categories
function getCategories() {
    return [
        'Bebidas',
        'Açougue',
        'Padaria', 
        'Laticínios',
        'Mercearia',
        'Higiene',
        'Limpeza',
        'Frutas',
        'Verduras e Legumes',
        'Congelados',
        'Doces e Sobremesas',
        'Café e Cereais Matinais',
        'Enlatados e Conservas',
        'Outros'
    ];
}

// Shared function to populate category select
function populateCategorySelect(selectId, includeEmpty = true) {
    const select = document.getElementById(selectId);
    if (!select) {
        console.error(`Select element with id '${selectId}' not found`);
        return;
    }

    const categories = getCategories();
    
    let options = '';
    if (includeEmpty) {
        options += '<option value="">Selecione uma categoria</option>';
    }
    
    options += categories.map(category => 
        `<option value="${category}">${category}</option>`
    ).join('');
    
    select.innerHTML = options;
}

async function loadPurchaseCategories(user_id) {
    try {
        const response = await fetch(`/.netlify/functions/get-purchase-categories?user_id=${user_id}`);
        if (!response.ok) {
            throw new Error(`Error fetching categories: ${response.status}`);
        }
        const categories = await response.json();
        return categories;
    } catch (error) {
        console.error('Error loading purchase categories:', error);
        // Return empty array on error so the form doesn't break
        return [];
    }
}

async function populatePurchaseCategorySelect(selectId, includeEmpty = true) {
    const select = document.getElementById(selectId);
    if (!select) {
        console.error(`Select element with id '${selectId}' not found`);
        return;
    }

    const user_id = await getUserId();
    if (!user_id) {
        console.error('User ID not found, cannot load categories');
        return;
    }

    try {
        const categories = await loadPurchaseCategories(user_id);
        
        let options = '';
        if (includeEmpty) {
            options += '<option value="">Selecione uma categoria</option>';
        }
        
        options += categories.map(category => 
            `<option value="${category.name}">${category.name}</option>`
        ).join('');
        
        select.innerHTML = options;
    } catch (error) {
        console.error('Error populating purchase category select:', error);
        // Fallback to empty select if categories fail to load
        select.innerHTML = includeEmpty ? '<option value="">Erro ao carregar categorias</option>' : '';
    }
}