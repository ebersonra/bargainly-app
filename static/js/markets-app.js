let mercados = [];

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

// Inicialização
updateMercadosList();