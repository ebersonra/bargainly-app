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