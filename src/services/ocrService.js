const purchaseService = require('./purchaseRecordService');

// Categorize items based on description or vendor keywords
function categorizeItem(description = '', vendor = '') {
  const str = `${description} ${vendor}`.toLowerCase();
  if (/a[cç]ougue|carne/.test(str)) return 'butcher';
  if (/hortifr[uú]ti|fruta|legume|verdura|banana|maç|maca|laranja/.test(str)) return 'produce';
  return 'market';
}

// Parse OCR text lines into items with description and amount
function parseLines(text) {
  if (!text) throw new Error('No OCR text provided');
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const match = line.match(/(.+?)\s+(\d+[\.,]?\d*)$/);
      if (!match) throw new Error(`Invalid line: ${line}`);
      const desc = match[1];
      const amount = parseFloat(match[2].replace(',', '.'));
      if (Number.isNaN(amount)) throw new Error(`Invalid amount in line: ${line}`);
      return { desc, amount };
    });
}

// Process OCR text, calculate totals per category and insert records
async function processReceipt({ user_id, vendor = '', text }, srv = purchaseService) {
  try {
    const items = parseLines(text);
    const totals = {};
    for (const item of items) {
      const category = categorizeItem(item.desc, vendor);
      totals[category] = (totals[category] || 0) + item.amount;
    }
    const records = [];
    for (const [category, amount] of Object.entries(totals)) {
      const record = await srv.insertPurchaseRecord({ user_id, amount, category });
      records.push(record);
    }
    return { manualEntry: false, records, totals };
  } catch (e) {
    return { manualEntry: true, error: e.message };
  }
}

module.exports = { categorizeItem, processReceipt, parseLines };
