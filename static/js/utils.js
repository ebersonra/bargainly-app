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