# Bargainly App - Copilot Instructions

## Architecture Overview

This is a price comparison and budget management web app built with vanilla JavaScript frontend and serverless backend (Netlify Functions + Supabase). The architecture follows a strict layered MVC pattern:

- **Frontend**: Tab-based SPA with module loading system (`src/config.js`) and organized utilities in `src/utils/`
- **Backend**: Netlify Functions implementing Controller → Service → Repository pattern with dependency injection
- **Database**: Supabase PostgreSQL with RLS policies, stored procedures, and versioned migrations in `db/`
- **Templates**: Custom ViewEngine (`src/views/ViewEngine.js`) with security-focused HTML escaping and iterative rendering
- **Testing**: Node.js test runner with CI-compatible mocks and environment detection

## Key Architectural Patterns

### 1. Testable Netlify Functions Pattern
All functions use dependency injection for testability:
```javascript
// netlify/functions/set-budget.js
function buildHandler(ctrl = controller) {
  return async function(event) { /* ... */ };
}
exports.handler = buildHandler();
exports.buildHandler = buildHandler; // For testing
```

### 2. Environment-Aware Configuration
Consistent pattern across all files:
```javascript
// Load env vars only in development
if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch (e) {}
}
```

### 3. Three-Layer Backend with Validation
- **Controllers** (`src/controllers/`): HTTP request handling, parameter validation
- **Services** (`src/services/`): Business logic with comprehensive validation
- **Repositories** (`src/repositories/`): Database access via Supabase RPC calls

Service pattern from `purchaseRecordService.js`:
```javascript
function validateRecord(data) {
  const required = ['user_id', 'amount', 'category'];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing field: ${field}`);
    }
  }
  if (data.amount <= 0) throw new Error('Amount must be greater than zero');
}

async function insertPurchaseRecord(data, repo = repository) {
  validateRecord(data);
  return repo.insertPurchaseRecord(data);
}
```

### 4. Frontend Module Loading System
Uses `src/config.js` to orchestrate module loading with dependency order:
```javascript
// Load order: utilities → services → models → controllers
await loadScript(`${CONFIG.srcPath}/utils/validation.js`);
await loadScript(`${CONFIG.srcPath}/services/barcodeService.js`);
await loadScript(`${CONFIG.srcPath}/models/PurchaseRecord.js`);
```

### 5. Secure ViewEngine with Performance Optimization
Custom template engine with XSS prevention and large dataset handling:
- HTML escaping by default: `{{variable}}` vs `{{{unescaped}}}`
- Block helpers processed before variable substitution
- Iterative rendering for large arrays to prevent stack overflow
- Smart rendering that chooses recursive vs iterative based on complexity

## Development Workflows

### Running Locally
```bash
netlify dev  # Starts local dev server with functions
```

### Testing Strategy
- **Test runner**: Node.js built-in test runner (`npm test`, `npm run test:unit/integration/e2e`)
- **Environment detection**: `isCI = process.env.CI || process.env.GITHUB_ACTIONS`
- **Mock strategy**: Use mocks in CI, real connections locally with valid UUIDs
- **Function testing**: Via exported `buildHandler()` pattern with dependency injection
- **DOM mocking**: Mock DOM for frontend component testing

Example test with environment detection:
```javascript
const isCI = process.env.CI || process.env.GITHUB_ACTIONS;
let supabase = isCI ? createMockSupabase() : createClient(url, key);
```

### Database Operations
All database access goes through repositories using Supabase stored procedures:
```javascript
// Repository pattern - always use RPC for complex operations
const { data, error } = await supabase.rpc('insert_purchase_record', {
  p_user_id: user_id, p_category: category, p_value: amount
});
```

### Authentication Pattern
Cookie-based user ID with UUID validation:
```javascript
// Frontend auth utility in static/js/utils.js
async function getUserId() {
  const match = document.cookie.match(/(?:^|; )user_id=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
```

## Critical Integration Points

### 1. User Authentication & Data Isolation
- Frontend uses cookie-based `user_id` (see `getUserId()` in `static/js/utils.js`)
- All backend operations filter by `user_id` for data isolation
- Database uses RLS policies for security
- **Critical**: Database expects UUID format for user_id, not strings like "test_user"

### 2. External API Integration
- **Bluesoft Cosmos**: Product data lookup by GTIN/barcode (`netlify/functions/bluesoft.js`)
- **ReceitaWS**: Company data lookup by CNPJ (`netlify/functions/get-receitaws.js`)
- **Gemini API**: OCR processing for receipt images (`netlify/functions/gemini.js`)
- **Anthropic/OpenAI**: Alternative AI providers with same interface

### 3. Database Design Patterns
- Uses PostgreSQL stored procedures (`insert_purchase_record`) for complex operations
- Soft deletes with `deleted_at` timestamps
- UUID primary keys with `gen_random_uuid()`
- RLS policies ensure user data isolation

### 4. Frontend State Management
- No framework - DOM manipulation in feature modules with shared utilities
- Module loading coordinated by `src/config.js` with dependency order
- Budget progress uses custom CSS: `.budget-bar`, `.budget-bar-container`
- Shared functions in `static/js/utils.js` (markets, categories, formatting)

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
- `src/views/ViewEngine.js` - Custom template engine with XSS protection and performance optimizations
- `static/js/utils.js` - Shared frontend utilities including auth and data formatting
- `src/config.js` - Module loading orchestration and dependency management
- `db/init.sql` - Database schema and RLS setup
- `tests/e2e/purchaseRecordFunctions.test.js` - Function testing examples with dependency injection
- `debug-test.js` - CI-compatible connection testing with environment detection
- `netlify.toml` - Build process with placeholder replacement

## Common Gotchas

1. **Module Loading Order**: `src/config.js` loads dependencies in specific order (utils → services → models → controllers)
2. **ViewEngine Security**: Default HTML escaping prevents XSS - use `{{{unescaped}}}` only with trusted data
3. **UUID Requirements**: Database expects valid UUIDs for user_id, test with valid UUIDs locally
4. **Environment Loading**: Functions handle both local (dotenv) and production environments
5. **Testing Patterns**: Use mocks in CI (`isCI = process.env.CI || process.env.GITHUB_ACTIONS`), real connections locally
6. **Template Performance**: ViewEngine automatically chooses iterative vs recursive rendering based on data complexity
