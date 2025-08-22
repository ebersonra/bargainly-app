// Initialize page data
async function initializePurchasePage() {
    try {
        // Populate market select
        populateMarketSelect('purchaseMarket');
        
        // Populate category select with user's categories from database
        await populatePurchaseCategorySelect('purchaseCategory');
    } catch (error) {
        console.error('Erro ao inicializar página de compras:', error);
    }
}

async function submitPurchaseForm(e) {
  e.preventDefault();
  
  const user_id = await getUserId();
  
  if (!user_id) {
      console.error('Erro: usuário não identificado');
      return;
  }

  const amount = Number(document.getElementById('purchaseAmount').value);
  const category = document.getElementById('purchaseCategory').value;
  const date = document.getElementById('purchaseDate').value;

  try {
    console.log('Registrando compra...');
    
    const response = await fetch('/.netlify/functions/insert-purchase-record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id, amount, category, date })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    e.target.reset();
    console.log('Compra registrada com sucesso!', result);
    
  } catch (error) {
    console.error('Erro ao registrar compra:', error);
  }
}

document.getElementById('purchaseForm')?.addEventListener('submit', submitPurchaseForm);

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePurchasePage);
