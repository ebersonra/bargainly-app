// Notification and UI utilities
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;
    
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = message ? 'block' : 'none';
}

// Market utilities
async function loadMarkets() {
    try {
        const response = await fetch('/.netlify/functions/get-markets');
        if (!response.ok) {
            throw new Error('Erro ao carregar mercados');
        }
        const markets = await response.json();
        return Array.isArray(markets) ? markets.map(m => ({
            id: m.id,
            nome: m.name,
            endereco: m.address,
            cnpj: m.cnpj
        })) : [];
    } catch (error) {
        console.error('Erro ao carregar mercados:', error);
        return [];
    }
}

function populateMarketSelect(selectId) {
    loadMarkets().then(markets => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '<option value="">Selecione um mercado</option>';
        markets.forEach(market => {
            const option = document.createElement('option');
            option.value = market.id;
            option.textContent = market.nome;
            select.appendChild(option);
        });
    });
}

function updateMercadoSelect() {
    populateMarketSelect('produtoMercado');
    populateMarketSelect('purchaseMarket');
}

// Category utilities
const predefinedCategories = [
    'Alimentação',
    'Transporte', 
    'Saúde',
    'Educação',
    'Entretenimento',
    'Roupas',
    'Casa',
    'Outros'
];

async function loadUserCategories() {
    try {
        const user_id = await getUserId();
        const response = await fetch(`/.netlify/functions/get-purchase-categories?user_id=${user_id}`);
        
        if (!response.ok) {
            console.error('Erro ao carregar categorias:', response.statusText);
            return predefinedCategories;
        }
        
        const categories = await response.json();
        if (Array.isArray(categories) && categories.length > 0) {
            const userCategories = categories.map(cat => cat.category);
            // Combine user categories with predefined ones, removing duplicates
            return [...new Set([...userCategories, ...predefinedCategories])];
        }
        
        return predefinedCategories;
    } catch (error) {
        console.error('Erro ao carregar categorias do usuário:', error);
        return predefinedCategories;
    }
}

function populateCategorySelect(selectId, includeEmpty = true) {
    loadUserCategories().then(categories => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = includeEmpty ? '<option value="">Selecione uma categoria</option>' : '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    });
}

async function populatePurchaseCategorySelect(selectId) {
    try {
        const categories = await loadUserCategories();
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '<option value="">Selecione uma categoria</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao popular select de categorias:', error);
    }
}

// Product utilities
function extrairDadosGTINs(gtins) {
    if (!Array.isArray(gtins) || gtins.length === 0) return null;
    return gtins.map(gtin => ({
        code: gtin.code,
        type_packaging: gtin.type_packaging
    }));
}

function buscarPorGTIN(gtins, targetGtin) {
    if (!gtins || !Array.isArray(gtins)) return null;
    return gtins.find(gtin => gtin.code === targetGtin);
}

function determinarUnidade(typePackaging) {
    const unidadeMap = {
        'un': 'unidade',
        'kg': 'kg', 
        'g': 'g',
        'l': 'litro',
        'ml': 'ml',
        'cx': 'caixa',
        'pct': 'pacote'
    };
    return unidadeMap[typePackaging] || 'unidade';
}

function verificaCategoria(category) {
    if (!category || !category.description) return false;
    return predefinedCategories.some(cat => 
        cat.toLowerCase().includes(category.description.toLowerCase()) ||
        category.description.toLowerCase().includes(cat.toLowerCase())
    );
}

function determinarCategoria(category, description) {
    if (category && verificaCategoria(category)) {
        return category.description;
    }
    
    // Fallback based on description keywords
    const desc = description.toLowerCase();
    if (desc.includes('leite') || desc.includes('pão') || desc.includes('carne')) return 'Alimentação';
    if (desc.includes('remédio') || desc.includes('farmácia')) return 'Saúde';
    if (desc.includes('roupa') || desc.includes('camisa')) return 'Roupas';
    
    return 'Outros';
}

// Barganha functionality
function updateBarganha() {
    // Implementation for barganha update
    console.log('Atualizando barganha...');
}

// Browser compatibility check
if (typeof window === 'undefined') {
    // Node.js environment - export as module
    module.exports = {
        showNotification,
        showMessage,
        loadMarkets,
        populateMarketSelect,
        updateMercadoSelect,
        loadUserCategories,
        populateCategorySelect,
        populatePurchaseCategorySelect,
        extrairDadosGTINs,
        buscarPorGTIN,
        determinarUnidade,
        verificaCategoria,
        determinarCategoria,
        updateBarganha,
        predefinedCategories
    };
} else {
    // Browser environment - make functions globally available
    window.showNotification = showNotification;
    window.showMessage = showMessage;
    window.loadMarkets = loadMarkets;
    window.populateMarketSelect = populateMarketSelect;
    window.updateMercadoSelect = updateMercadoSelect;
    window.loadUserCategories = loadUserCategories;
    window.populateCategorySelect = populateCategorySelect;
    window.populatePurchaseCategorySelect = populatePurchaseCategorySelect;
    window.extrairDadosGTINs = extrairDadosGTINs;
    window.buscarPorGTIN = buscarPorGTIN;
    window.determinarUnidade = determinarUnidade;
    window.verificaCategoria = verificaCategoria;
    window.determinarCategoria = determinarCategoria;
    window.updateBarganha = updateBarganha;
    window.predefinedCategories = predefinedCategories;
}
