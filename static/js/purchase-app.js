async function submitPurchaseForm(e) {
  e.preventDefault();
  const user_id = 1; // demo user
  const amount = Number(document.getElementById('purchaseAmount').value);
  const category = document.getElementById('purchaseCategory').value;
  const date = document.getElementById('purchaseDate').value;
  await fetch('/.netlify/functions/insert-purchase-record', {
    method: 'POST',
    body: JSON.stringify({ user_id, amount, category, date })
  });
  e.target.reset();
  alert('Compra registrada');
}

document.getElementById('purchaseForm')?.addEventListener('submit', submitPurchaseForm);
