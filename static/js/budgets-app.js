async function getUserId() {
  if(!window.supabase?.auth){
    console.error('Supabase client not initialized');
    throw new Error('Supabase client not initialized');
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    console.error('Erro ao obter usuário:', error);
    throw error || new Error('Usuário não autenticado');
  }
  return data.user.id;
}

async function loadBudgets() {
  try {
    const user_id = await getUserId();
    const res = await fetch(`/.netlify/functions/get-budget-status?user_id=${user_id}`);
    if (!res.ok) throw new Error('Falha ao carregar metas');
    const budgets = await res.json();
    const list = document.getElementById('budgetsList');
    list.innerHTML = '';
    if (!Array.isArray(budgets) || budgets.length === 0) {
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
  try {
    const user_id = await getUserId();
    const category = document.getElementById('budgetCategory').value;
    const limit = Number(document.getElementById('budgetLimit').value);
    const res = await fetch('/.netlify/functions/set-budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, category, limit })
    });
    if (!res.ok) {
      console.error('Erro ao salvar meta:', await res.text());
    }
  } catch (err) {
    console.error(err);
  }
  e.target.reset();
  loadBudgets();
}

document.getElementById('budgetForm')?.addEventListener('submit', submitBudgetForm);

document.addEventListener('DOMContentLoaded', loadBudgets);
