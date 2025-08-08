async function loadDashboard() {
  try {
    const res = await fetch('/.netlify/functions/get-budget-status');
    if (!res.ok) throw new Error('Falha ao carregar metas');
    const budgets = await res.json();
    if (!Array.isArray(budgets)) throw new Error('Resposta inválida');
    const list = document.getElementById('dashboardList');
    list.innerHTML = '';
    budgets.forEach(b => {
      const item = document.createElement('div');
      item.className = 'dashboard-item';
      let color = '#48bb78';
      if (b.alert === 'near limit') color = '#ecc94b';
      if (b.alert === 'limit exceeded') color = '#e53e3e';
      item.innerHTML = `<strong>${b.category}</strong>: R$${b.spent} / R$${b.limit}`;
      item.style.color = color;
      list.appendChild(item);
    });
  } catch (e) {
    console.error(e);
  }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
