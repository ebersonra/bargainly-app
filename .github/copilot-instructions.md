# Bargainly App - Copilot Instructions

## Architecture Overview

This is a price comparison and budget management web app built with vanilla JavaScript frontend and serverless backend (Netlify Functions + Supabase). The architecture follows a strict layered pattern:

- **Frontend**: Tab-based SPA in `index.html` with modular JS files in `static/js/`
- **Backend**: Netlify Functions in `netlify/functions/` implementing Controller → Service → Repository pattern
- **Database**: Supabase PostgreSQL with RLS policies, migrations in `db/`
- **Templates**: Custom ViewEngine (`src/views/ViewEngine.js`) with Handlebars-like syntax for component rendering

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

Example service pattern from `purchaseRecordService.js`:
```javascript
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

### 4. Custom ViewEngine System
Lightweight template system (`src/views/ViewEngine.js`) with:
- Template caching (`Map` cache)
- Handlebars-like syntax: `{{variable}}`, `{{#each}}`, `{{#if}}`
- Browser/Node.js compatibility
- **Fixed**: Block helpers (each, if, unless) are now processed before variable substitution, ensuring loop variables render correctly

### 5. Database Access Pattern
Repository layer uses Supabase service key for RPC calls:
```javascript
const { data, error } = await supabase.rpc('insert_purchase_record', {
  p_user_id: user_id,
  p_category: category,
  p_value: amount,
});
```

## Development Workflows

### Running Locally
```bash
netlify dev  # Starts local dev server with functions
```

### Testing Strategy
- **Test runner**: Node.js built-in test runner (`npm test`)
- **Test files**: `tests/{unit,integration,e2e}/*.test.js`
- **CI/Mock pattern**: Environment detection for CI vs local testing
- **Functions testing**: Via exported `buildHandler()` pattern with dependency injection

### Environment Variables
All functions check `process.env.NODE_ENV !== 'production'` and conditionally load dotenv.
Required vars: `SUPABASE_URL`, `SUPABASE_SERVICE_API_KEY`, `GEMINI_API_KEY`, `BLUESOFT_API_KEY`

## Critical Integration Points

### 1. User Authentication
- Frontend uses cookie-based `user_id` (see `getUserId()` in `static/js/utils.js`)
- All backend operations filter by `user_id` for data isolation
- Database uses RLS policies for security

### 2. External APIs
- **Bluesoft Cosmos**: Product data lookup by GTIN/barcode
- **ReceitaWS**: Company data lookup by CNPJ  
- **Gemini API**: OCR processing for receipt images
- **Multiple AI providers**: Anthropic, OpenAI support

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

### 4. Test Mocking Patterns
- Environment detection: `isCI = process.env.CI || process.env.GITHUB_ACTIONS`
- Mock objects for CI environments
- Dependency injection for testable functions
- DOM mocking for frontend components

### 5. Build Process
Uses `sed` in `netlify.toml` to replace placeholders like `__GEMINI_API_KEY__` during build.

## Key Files to Understand

- `src/services/purchaseRecordService.js` - Core business logic with validation patterns
- `src/views/ViewEngine.js` - Custom template engine (has known variable substitution bugs)
- `static/js/utils.js` - Shared frontend utilities including auth
- `db/init.sql` - Database schema and RLS setup
- `tests/e2e/purchaseRecordFunctions.test.js` - Function testing examples
- `debug-test.js` - CI-compatible connection testing with environment detection

## Common Gotchas

1. **ViewEngine**: Now correctly processes block helpers before variables, ensuring proper loop variable rendering
2. **UUID requirements**: Database expects UUIDs for user_id, not strings like "test_user"
3. **Environment loading**: Functions must handle both local (dotenv) and production environments
4. **Testing pattern**: Use mocks in CI, real connections locally with valid UUIDs
