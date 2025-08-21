# Bargainly App - Copilot Instructions

## Architecture Overview

This is a price comparison and budget management web app built with vanilla JavaScript frontend and serverless backend (Netlify Functions + Supabase). The architecture follows a layered pattern:

- **Frontend**: Tab-based SPA in `index.html` with modular JS files in `static/js/`
- **Backend**: Netlify Functions in `netlify/functions/` implementing Controller → Service → Repository pattern
- **Database**: Supabase PostgreSQL with RLS policies, migrations in `db/`

## Key Architectural Patterns

### 1. Testable Netlify Functions Pattern
Functions use dependency injection for testing:
```javascript
// netlify/functions/set-budget.js
function buildHandler(ctrl = controller) {
  return async function(event) { /* ... */ };
}
exports.handler = buildHandler();
exports.buildHandler = buildHandler; // For testing
```

### 2. Three-Layer Backend Structure
- **Controllers** (`src/controllers/`): Thin wrappers calling services
- **Services** (`src/services/`): Business logic with validation
- **Repositories** (`src/repositories/`): Database access via Supabase client

Example service pattern:
```javascript
// Always validate input, delegate to repository
function validateRecord(data) {
  const required = ['user_id', 'amount', 'category'];
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
```

### 3. Frontend Module Pattern
Each feature has its own JS module loaded in `index.html`:
- `products-app.js` - Product management with barcode scanning
- `budgets-app.js` - Budget tracking with visual progress bars  
- `markets-app.js` - Market/store management with CNPJ lookup
- `utils.js` - Shared utilities including `getUserId()` from cookies

### 4. Database Access Pattern
Repository layer uses Supabase service key for RPC calls:
```javascript
const { data, error } = await supabase.rpc('insert_purchase_record', {
  p_user_id: user_id,
  p_category: category,
  p_value: amount,
  // ...
});
```

## Development Workflows

### Running Locally
```bash
netlify dev  # Starts local dev server with functions
```

### Testing Strategy
- Unit tests: `npm test` (Node.js built-in test runner)
- Test files follow pattern: `tests/{unit,integration,e2e}/*.test.js`
- Functions are testable via exported `buildHandler()` pattern

### Environment Variables
All functions check `process.env.NODE_ENV !== 'production'` and conditionally load dotenv.
Required vars: `SUPABASE_URL`, `SUPABASE_SERVICE_API_KEY`, `GEMINI_API_KEY`, `BLUESOFT_API_KEY`

## Critical Integration Points

### 1. User Authentication
- Frontend uses cookie-based `user_id` (see `getUserId()` in `utils.js`)
- All backend operations filter by `user_id` for data isolation
- Database uses RLS policies for security

### 2. External APIs
- **Bluesoft Cosmos**: Product data lookup by GTIN/barcode
- **ReceitaWS**: Company data lookup by CNPJ  
- **Gemini API**: OCR processing for receipt images

### 3. Database Design
- Uses PostgreSQL stored procedures (`insert_purchase_record`) for complex operations
- Soft deletes with `deleted_at` timestamps
- UUID primary keys with `gen_random_uuid()`

## Project-Specific Conventions

### 1. Error Handling
Services throw descriptive errors; functions catch and return standardized JSON:
```javascript
catch (e) {
  return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
}
```

### 2. Frontend State Management
No framework - DOM manipulation in feature modules with shared utilities.
Budget progress uses custom CSS classes: `.budget-bar`, `.budget-bar-container`

### 3. CSS Architecture
Single `static/css/style.css` with CSS custom properties for theming.
Tab system uses `.tab-content` with `.active` class toggling.

### 4. Build Process
Uses `sed` in `netlify.toml` to replace placeholders like `__GEMINI_API_KEY__` during build.

## Key Files to Understand

- `src/services/purchaseRecordService.js` - Core business logic
- `static/js/utils.js` - Shared frontend utilities
- `db/init.sql` - Database schema and RLS setup
- `tests/e2e/purchaseRecordFunctions.test.js` - Function testing examples
