// Initialize page data
async function initializePurchasePage() {
    try {
        // Populate market select
        populateMarketSelect('purchaseMarket');
        
        // Populate category select
        populateCategorySelect('purchaseCategory');
    } catch (error) {
        console.error('Erro ao inicializar página de compras:', error);
    }
}

async function submitPurchaseForm(e) {
  e.preventDefault();
  
  const user_id = await getUserId();
  
  if (!user_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing user_id' }) };
  }

  const amount = Number(document.getElementById('purchaseAmount').value);
  const category = document.getElementById('purchaseCategory').value;
  const date = document.getElementById('purchaseDate').value;

  await fetch('/.netlify/functions/insert-purchase-record', {
    method: 'POST',
    body: JSON.stringify({ user_id, amount, category, date })
  });

  e.target.reset();
  showMessage('Compra registrada', 'success');
}

document.getElementById('purchaseForm')?.addEventListener('submit', submitPurchaseForm);

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePurchasePage);
