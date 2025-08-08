async function loadBudgets() {
  try {
    const res = await fetch('/.netlify/functions/get-budget-status');
    const budgets = await res.json();
    const list = document.getElementById('budgetsList');
    list.innerHTML = '';
    if (budgets.length === 0) {
      list.innerHTML = '<p>Nenhuma meta cadastrada</p>';
      return;
    }
    budgets.forEach(b => {
      const item = document.createElement('div');
      item.className = 'budget-item';
      const bar = document.createElement('div');
      bar.className = 'budget-bar';
      bar.style.width = Math.min(b.percentage, 100) + '%';
      if (b.alert === 'near limit') bar.style.background = '#ecc94b';
      if (b.alert === 'limit exceeded') bar.style.background = '#e53e3e';
      item.innerHTML = `<strong>${b.category}</strong>: R$${b.spent} / R$${b.limit}`;
      const container = document.createElement('div');
      container.className = 'budget-bar-container';
      container.appendChild(bar);
      item.appendChild(container);
      list.appendChild(item);
    });
  } catch (e) {
    console.error(e);
  }
}

async function submitBudgetForm(e) {
  e.preventDefault();
  const category = document.getElementById('budgetCategory').value;
  const limit = Number(document.getElementById('budgetLimit').value);
  await fetch('/.netlify/functions/set-budget', {
    method: 'POST',
    body: JSON.stringify({ category, limit })
  });
  e.target.reset();
  loadBudgets();
}

document.getElementById('budgetForm')?.addEventListener('submit', submitBudgetForm);

document.addEventListener('DOMContentLoaded', loadBudgets);
