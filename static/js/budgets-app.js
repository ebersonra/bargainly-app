async function loadBudgets(options = {}) {
  try {
    const user_id = await getUserId();
    
    // Construir query parameters
    const queryParams = new URLSearchParams({ user_id });
    
    if (options.startDate) {
      queryParams.append('startDate', options.startDate);
    }
    
    if (options.endDate) {
      queryParams.append('endDate', options.endDate);
    }
    
    if (options.category) {
      queryParams.append('category', options.category);
    }
    
    const res = await fetch(`/.netlify/functions/get-budget-status?${queryParams.toString()}`);
    
    if (!res.ok) {
      throw new Error('Falha ao carregar metas');
    }

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

// Funções para filtros de período
function getDateRangeOptions() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  return {
    thisMonth: {
      startDate: new Date(currentYear, currentMonth, 1).toISOString().slice(0, 10),
      endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().slice(0, 10),
      label: 'Este mês'
    },
    lastMonth: {
      startDate: new Date(currentYear, currentMonth - 1, 1).toISOString().slice(0, 10),
      endDate: new Date(currentYear, currentMonth, 0).toISOString().slice(0, 10),
      label: 'Mês passado'
    },
    last3Months: {
      startDate: new Date(currentYear, currentMonth - 3, 1).toISOString().slice(0, 10),
      endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().slice(0, 10),
      label: 'Últimos 3 meses'
    },
    thisYear: {
      startDate: new Date(currentYear, 0, 1).toISOString().slice(0, 10),
      endDate: new Date(currentYear, 11, 31).toISOString().slice(0, 10),
      label: 'Este ano'
    }
  };
}

function handlePeriodChange(periodKey) {
  const periods = getDateRangeOptions();
  const selectedPeriod = periods[periodKey];
  
  if (selectedPeriod) {
    loadBudgets({
      startDate: selectedPeriod.startDate,
      endDate: selectedPeriod.endDate
    });
  }
}

function handleCustomDateRange() {
  const startDate = document.getElementById('startDate')?.value;
  const endDate = document.getElementById('endDate')?.value;
  
  if (startDate && endDate) {
    loadBudgets({ startDate, endDate });
  }
}

function setupPeriodFilters() {
  // Setup period selector if exists
  const periodSelect = document.getElementById('periodSelect');
  if (periodSelect) {
    const periods = getDateRangeOptions();
    
    // Populate options
    periodSelect.innerHTML = '<option value="">Selecione um período</option>';
    Object.entries(periods).forEach(([key, period]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = period.label;
      periodSelect.appendChild(option);
    });
    
    // Add event listener
    periodSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        handlePeriodChange(e.target.value);
      }
    });
  }
  
  // Setup custom date inputs if they exist
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (startDateInput && endDateInput) {
    const updateDateRange = () => handleCustomDateRange();
    startDateInput.addEventListener('change', updateDateRange);
    endDateInput.addEventListener('change', updateDateRange);
  }
}

document.getElementById('budgetForm')?.addEventListener('submit', submitBudgetForm);

document.addEventListener('DOMContentLoaded', () => {
  // Populate category select if it exists
  populateCategorySelect('budgetCategory', false);
  
  // Setup period filters
  setupPeriodFilters();
  
  // Load existing budgets (default: current month)
  loadBudgets();
});
