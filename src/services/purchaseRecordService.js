const repository = require('../repositories/purchaseRecordRepository');

function validateRecord(data) {
  const required = ['user_id', 'amount', 'category'];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing field: ${field}`);
    }
  }
}

function validateBudget(data) {
  const required = ['category', 'limit'];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing field: ${field}`);
    }
  }
}

async function insertPurchaseRecord(data, repo = repository) {
  validateRecord(data);
  return repo.insertPurchaseRecord(data);
}

async function setBudget(data, repo = repository) {
  validateBudget(data);
  return repo.upsertBudget(data);
}

async function getBudgetStatus(repo = repository) {
  const budgets = await repo.fetchBudgets();
  const spent = await repo.fetchTotalSpent();
  const totals = spent.reduce((acc, rec) => {
    acc[rec.category] = (acc[rec.category] || 0) + rec.amount;
    return acc;
  }, {});
  return budgets.map(budget => {
    const spentAmount = totals[budget.category] || 0;
    const percentage = budget.limit > 0 ? (spentAmount / budget.limit) * 100 : 0;
    let alert = null;
    if (percentage >= 100) alert = 'limit exceeded';
    else if (percentage >= 80) alert = 'near limit';
    return {
      category: budget.category,
      limit: budget.limit,
      spent: spentAmount,
      percentage,
      alert
    };
  });
}

module.exports = { insertPurchaseRecord, getBudgetStatus, setBudget };
