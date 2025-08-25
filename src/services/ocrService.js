/**
 * OCR Service
 * Business logic layer for OCR processing and data extraction
 * Following the Controller → Service → Repository pattern
 */

/**
 * Extract items from receipt text with basic categorization
 * @param {string} text - Receipt text
 * @returns {Array} - Array of items with categories
 */
function extractItemsFromText(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const items = [];
  const lines = text.split('\n');
  
  // Simple pattern matching for items and prices
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return;
    
    // Pattern: "ItemName Price" (supports various formats)
    const match = trimmed.match(/^(.+?)\s+(\d+(?:[.,]\d{2})?)$/);
    if (match) {
      const name = match[1].trim();
      const price = parseFloat(match[2].replace(',', '.'));
      
      if (name.length > 1 && price > 0) {
        items.push({
          name,
          price,
          category: categorizeItem(name),
          quantity: 1
        });
      }
    }
  });
  
  return items;
}

/**
 * Simple item categorization based on name
 * @param {string} itemName - Name of the item
 * @returns {string} - Category of the item
 */
function categorizeItem(itemName) {
  const name = itemName.toLowerCase();
  
  // Produce
  if (name.includes('banana') || name.includes('maça') || name.includes('tomate') || 
      name.includes('alface') || name.includes('cebola') || name.includes('batata')) {
    return 'produce';
  }
  
  // Butcher/Meat
  if (name.includes('carne') || name.includes('frango') || name.includes('peixe') || 
      name.includes('linguiça') || name.includes('bacon')) {
    return 'butcher';
  }
  
  // Dairy
  if (name.includes('leite') || name.includes('queijo') || name.includes('iogurte') || 
      name.includes('manteiga')) {
    return 'dairy';
  }
  
  // Default
  return 'others';
}

/**
 * Process receipt data (image or text) and create purchase records
 * @param {Object} data - Receipt data with user_id, vendor, text etc
 * @param {Object} purchaseService - Service for creating purchase records
 * @returns {Object} - Processed receipt data with records and manualEntry flag
 */
async function processReceipt(data, purchaseService = null) {
  if (!data) {
    throw new Error('Receipt data is required');
  }
  
  try {
    // Extract items from text
    let items = [];
    let manualEntry = false;
    
    if (data.text) {
      items = extractItemsFromText(data.text);
      if (items.length === 0) {
        manualEntry = true;
        return { records: [], manualEntry: true };
      }
    } else {
      manualEntry = true;
      return { records: [], manualEntry: true };
    }
    
    // Create purchase records if service provided
    const records = [];
    if (purchaseService && items.length > 0) {
      for (const item of items) {
        const record = {
          user_id: data.user_id,
          vendor: data.vendor || 'Unknown',
          product_name: item.name,
          amount: item.price,
          category: item.category,
          quantity: item.quantity || 1
        };
        
        const savedRecord = await purchaseService.insertPurchaseRecord(record);
        records.push(savedRecord);
      }
    }
    
    return { records, manualEntry };
  } catch (error) {
    return { records: [], manualEntry: true };
  }
}

/**
 * Process receipt image with OCR
 * @param {Buffer|File} imageData - Image data to process
 * @param {Object} options - Processing options
 * @returns {Object} - OCR results with extracted text and items
 */
async function processReceiptImage(imageData, options = {}) {
  if (!imageData) {
    throw new Error('Image data is required');
  }
  
  try {
    // Call external OCR service (Gemini, Tesseract, etc.)
    const ocrText = await callOcrApi(imageData, options);
    
    if (!ocrText || ocrText.trim() === '') {
      return {
        success: false,
        error: 'No text found in image',
        items: []
      };
    }
    
    // Extract structured data from OCR text
    const extractedData = await extractPurchaseDataFromText(ocrText, options);
    
    return {
      success: true,
      ocrText,
      ...extractedData
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      items: []
    };
  }
}

/**
 * Extract purchase data from text using AI
 * @param {string} text - Raw text from OCR or user input
 * @param {Object} options - Processing options
 * @returns {Object} - Extracted and structured purchase data
 */
async function extractPurchaseDataFromText(text, options = {}) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text is required and must be a string');
  }
  
  if (text.trim().length === 0) {
    return {
      items: [],
      total: 0,
      marketInfo: null
    };
  }
  
  try {
    // Call AI service for data extraction
    const extractedData = await callAiExtractionApi(text, options);
    
    // Validate and clean extracted items
    const validatedItems = validateAndCleanItems(extractedData.items || []);
    
    return {
      items: validatedItems,
      total: calculateTotal(validatedItems),
      marketInfo: extractedData.marketInfo || null,
      rawText: text
    };
  } catch (error) {
    throw new Error(`Failed to extract purchase data: ${error.message}`);
  }
}

/**
 * Call external OCR API (placeholder for actual implementation)
 * @param {Buffer|File} imageData - Image data
 * @param {Object} options - OCR options
 * @returns {string} - Extracted text
 */
async function callOcrApi(imageData, options = {}) {
  // This would call the actual OCR service (Gemini, Google Vision, etc.)
  // For now, return placeholder
  
  if (options.mockResponse) {
    return options.mockResponse;
  }
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  throw new Error('OCR service not implemented - please implement callOcrApi function');
}

/**
 * Call AI extraction API (placeholder for actual implementation)
 * @param {string} text - Text to extract data from
 * @param {Object} options - Extraction options
 * @returns {Object} - Extracted structured data
 */
async function callAiExtractionApi(text, options = {}) {
  // This would call the actual AI service (Gemini, OpenAI, etc.)
  // For now, return basic extraction
  
  if (options.mockResponse) {
    return options.mockResponse;
  }
  
  // Basic pattern-based extraction as fallback
  return extractBasicPatterns(text);
}

/**
 * Extract basic patterns from text (fallback method)
 * @param {string} text - Text to extract from
 * @returns {Object} - Basic extracted data
 */
function extractBasicPatterns(text) {
  const items = [];
  const lines = text.split('\n');
  
  // Simple pattern matching for items and prices
  const itemPattern = /^(.+?)\s+R?\$?\s*(\d+[.,]\d{2})$/;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return;
    
    const match = trimmed.match(itemPattern);
    if (match) {
      const name = match[1].trim();
      const price = parseFloat(match[2].replace(',', '.'));
      
      if (name.length > 2 && price > 0) {
        items.push({
          name,
          price,
          category: 'Outros',
          quantity: 1
        });
      }
    }
  });
  
  return {
    items,
    marketInfo: null
  };
}

/**
 * Validate and clean extracted items
 * @param {Array} items - Raw extracted items
 * @returns {Array} - Validated and cleaned items
 */
function validateAndCleanItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  
  return items
    .filter(item => {
      // Filter out invalid items
      return item && 
             typeof item.name === 'string' && 
             item.name.trim().length > 0 &&
             typeof item.price === 'number' && 
             item.price > 0;
    })
    .map(item => ({
      name: item.name.trim(),
      price: Math.round(item.price * 100) / 100, // Round to 2 decimal places
      category: item.category || 'Outros',
      quantity: item.quantity || 1
    }));
}

/**
 * Calculate total from items
 * @param {Array} items - Array of items with prices
 * @returns {number} - Total amount
 */
function calculateTotal(items) {
  if (!Array.isArray(items)) {
    return 0;
  }
  
  return items.reduce((total, item) => {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    return total + itemTotal;
  }, 0);
}

/**
 * Extract market information from text
 * @param {string} text - Receipt text
 * @returns {Object|null} - Market information if found
 */
function extractMarketInfo(text) {
  // Basic market info extraction
  const lines = text.split('\n').slice(0, 10); // Check first 10 lines
  
  let marketName = null;
  let cnpj = null;
  let address = null;
  
  // Look for CNPJ pattern
  const cnpjPattern = /(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Try to extract CNPJ
    const cnpjMatch = trimmed.match(cnpjPattern);
    if (cnpjMatch && !cnpj) {
      cnpj = cnpjMatch[1].replace(/\D/g, '');
    }
    
    // Try to extract market name (first non-empty line that's not CNPJ)
    if (!marketName && trimmed.length > 3 && !cnpjMatch) {
      marketName = trimmed;
    }
  });
  
  return marketName || cnpj ? { marketName, cnpj, address } : null;
}

module.exports = { 
  processReceipt,
  extractItemsFromText,
  categorizeItem,
  processReceiptImage,
  extractPurchaseDataFromText,
  validateAndCleanItems,
  calculateTotal,
  extractMarketInfo
};
