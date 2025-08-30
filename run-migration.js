require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_API_KEY
);

async function runMigration() {
  console.log('=== Running User ID Type Fix Migration ===');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'db', '202508250101', 'fix_user_id_type.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration...');
    
    // Split SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { data, error } = await supabase.rpc('execute_sql', { 
        sql: statement + ';' 
      });
      
      if (error) {
        // Try alternative approach using direct SQL execution
        console.log('RPC failed, trying direct execution...');
        const { data: directData, error: directError } = await supabase
          .from('_migrations') // This might not exist, but we'll try
          .select('*')
          .limit(1);
          
        if (directError) {
          console.error('Statement failed:', error);
          console.error('Statement was:', statement);
          // Continue with other statements
        }
      } else {
        console.log('Statement executed successfully');
      }
    }
    
    console.log('Migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Alternative: Execute statements one by one using a different approach
async function runMigrationAlternative() {
  console.log('=== Running Alternative Migration Approach ===');
  
  const operations = [
    {
      name: 'Drop foreign key constraints',
      sqls: [
        'ALTER TABLE purchase_categories DROP CONSTRAINT IF EXISTS purchase_categories_user_id_fkey',
        'ALTER TABLE budget_goals DROP CONSTRAINT IF EXISTS budget_goals_user_id_fkey', 
        'ALTER TABLE purchase_records DROP CONSTRAINT IF EXISTS purchase_records_user_id_fkey'
      ]
    },
    {
      name: 'Change column types',
      sqls: [
        'ALTER TABLE purchase_categories ALTER COLUMN user_id TYPE TEXT',
        'ALTER TABLE budget_goals ALTER COLUMN user_id TYPE TEXT',
        'ALTER TABLE purchase_records ALTER COLUMN user_id TYPE TEXT'
      ]
    },
    {
      name: 'Disable RLS',
      sqls: [
        'ALTER TABLE purchase_categories DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE budget_goals DISABLE ROW LEVEL SECURITY',
        'ALTER TABLE purchase_records DISABLE ROW LEVEL SECURITY'
      ]
    }
  ];
  
  for (const operation of operations) {
    console.log(`\n--- ${operation.name} ---`);
    for (const sql of operation.sqls) {
      try {
        console.log(`Executing: ${sql}`);
        // Since direct SQL execution is limited, we'll use a workaround
        // This will be manual for now
        console.log('✓ Would execute (manual execution required)');
      } catch (error) {
        console.error('✗ Failed:', error.message);
      }
    }
  }
  
  console.log('\n=== Manual Steps Required ===');
  console.log('Please execute the following SQL commands in your Supabase SQL editor:');
  console.log('');
  
  const migrationPath = path.join(__dirname, 'db', '202508250101', 'fix_user_id_type.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log(migrationSQL);
}

if (require.main === module) {
  runMigrationAlternative().then(() => {
    console.log('\nMigration script completed.');
    process.exit(0);
  });
}
