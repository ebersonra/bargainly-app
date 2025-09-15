require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_API_KEY
);

// Function to discover all SQL files in db/ directory
function discoverSqlFiles(dbPath) {
  const files = [];
  
  // Get all items in db directory
  const items = fs.readdirSync(dbPath, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dbPath, item.name);
    
    if (item.isFile() && item.name.endsWith('.sql')) {
      // Direct SQL file in db/ (like init.sql)
      files.push({
        path: fullPath,
        name: item.name,
        category: 'root',
        timestamp: '000000000000' // Give root files earliest timestamp
      });
    } else if (item.isDirectory()) {
      // Check if directory contains SQL files
      try {
        const subItems = fs.readdirSync(fullPath, { withFileTypes: true });
        for (const subItem of subItems) {
          if (subItem.isFile() && subItem.name.endsWith('.sql')) {
            files.push({
              path: path.join(fullPath, subItem.name),
              name: subItem.name,
              category: item.name,
              timestamp: item.name // Use directory name as timestamp for sorting
            });
          }
        }
      } catch (err) {
        console.warn(`Could not read directory ${fullPath}:`, err.message);
      }
    }
  }
  
  // Sort files by timestamp (directory name) and then by filename
  files.sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return a.timestamp.localeCompare(b.timestamp);
    }
    return a.name.localeCompare(b.name);
  });
  
  return files;
}

// Function to execute a single SQL file
async function executeSqlFile(filePath, fileName) {
  console.log(`\n--- Executing ${fileName} ---`);
  
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // First, check if RPC function is available by testing with a simple query
    let rpcAvailable = false;
    try {
      const { data, error } = await supabase.rpc('execute_sql', { sql: 'SELECT 1;' });
      rpcAvailable = !error || !error.message.includes('Could not find the function public.execute_sql');
    } catch (e) {
      rpcAvailable = false;
    }
    
    if (!rpcAvailable) {
      console.log(`⚠️  Supabase RPC function 'execute_sql' is not available.`);
      console.log(`📋 MANUAL EXECUTION REQUIRED:`);
      console.log(`   Please execute this SQL manually in your Supabase SQL Editor:`);
      console.log(`   👉 https://app.supabase.com/project/YOUR_PROJECT/sql`);
      console.log(`\n📄 Complete SQL to execute:`);
      console.log('='.repeat(60));
      console.log(sqlContent);
      console.log('='.repeat(60));
      console.log(`\n💡 TIP: Copy the entire SQL block above and paste it into Supabase SQL Editor.`);
      return false; // Indicates manual execution needed
    }
    
    // If RPC is available, proceed with automatic execution
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements`);
    console.log(`✅ RPC function available - executing automatically...`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement.trim()) continue;
      
      try {
        const { data, error } = await supabase.rpc('execute_sql', { 
          sql: statement + ';' 
        });
        
        if (error) {
          console.log(`  ❌ Statement ${i + 1} failed: ${error.message}`);
          failCount++;
        } else {
          successCount++;
        }
      } catch (rpcError) {
        console.log(`  ❌ Statement ${i + 1} error: ${rpcError.message}`);
        failCount++;
      }
    }
    
    console.log(`\n📊 Execution Results:`);
    console.log(`   ✅ Successful: ${successCount} statements`);
    console.log(`   ❌ Failed: ${failCount} statements`);
    
    if (failCount === 0) {
      console.log(`✅ Migration completed successfully!`);
      return true;
    } else {
      console.log(`⚠️  Some statements failed. Check logs above for details.`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Failed to process ${fileName}:`, error.message);
    return false;
  }
}

async function runAllMigrations() {
  console.log('=== Running All SQL Migrations ===');
  
  try {
    const dbPath = path.join(__dirname, 'db');
    const sqlFiles = discoverSqlFiles(dbPath);
    
    console.log(`\nDiscovered ${sqlFiles.length} SQL files:`);
    sqlFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.category}/${file.name}`);
    });
    
    console.log('\n--- Starting execution ---');
    
    let successCount = 0;
    let failCount = 0;
    let manualInterventionNeeded = false;
    
    for (const file of sqlFiles) {
      const success = await executeSqlFile(file.path, `${file.category}/${file.name}`);
      if (success) {
        successCount++;
      } else {
        failCount++;
        manualInterventionNeeded = true;
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`✅ Successfully executed: ${successCount} files`);
    console.log(`⚠️  Requires manual execution: ${failCount} files`);
    console.log(`📊 Total: ${sqlFiles.length} files`);
    
    if (manualInterventionNeeded) {
      console.log('\n🔧 NEXT STEPS:');
      console.log('   1. Copy the SQL statements shown above');
      console.log('   2. Go to your Supabase project SQL Editor');
      console.log('   3. Paste and execute the SQL manually');
      console.log('   4. Verify the migration completed successfully');
    }
    
  } catch (error) {
    console.error('Migration discovery failed:', error);
  }
}

// Manual execution function for cases where RPC doesn't work
async function listAllMigrations() {
  console.log('=== Listing All Migrations for Manual Execution ===');
  
  try {
    const dbPath = path.join(__dirname, 'db');
    const sqlFiles = discoverSqlFiles(dbPath);
    
    console.log('\nSQL files found (in execution order):');
    console.log('=====================================');
    
    for (const file of sqlFiles) {
      console.log(`\n--- ${file.category}/${file.name} ---`);
      try {
        const sqlContent = fs.readFileSync(file.path, 'utf8');
        console.log(sqlContent);
        console.log('\n' + '='.repeat(50));
      } catch (error) {
        console.error(`Error reading ${file.path}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Failed to list migrations:', error);
  }
}

// Function to execute a specific migration file
async function runSpecificMigration(target, showOnly = false) {
  console.log(`=== ${showOnly ? 'Showing' : 'Running'} Specific Migration: ${target} ===`);
  
  try {
    const dbPath = path.join(__dirname, 'db');
    const sqlFiles = discoverSqlFiles(dbPath);
    
    // Find matching file(s)
    const matchingFiles = sqlFiles.filter(file => {
      // Check if target matches folder name, file name, or full path
      return file.category === target || 
             file.name === target ||
             file.name === `${target}.sql` ||
             `${file.category}/${file.name}` === target ||
             file.path.includes(target);
    });
    
    if (matchingFiles.length === 0) {
      console.error(`❌ No migration file found matching: ${target}`);
      console.log('\nAvailable options:');
      sqlFiles.forEach(file => {
        console.log(`  - ${file.category}/${file.name}`);
        console.log(`  - ${file.category}`);
        console.log(`  - ${file.name}`);
      });
      return;
    }
    
    console.log(`\nFound ${matchingFiles.length} matching file(s):`);
    matchingFiles.forEach(file => {
      console.log(`  - ${file.category}/${file.name}`);
    });
    
    if (showOnly) {
      console.log('\n--- Showing SQL Content ---');
      for (const file of matchingFiles) {
        showSqlContent(file.path, `${file.category}/${file.name}`);
      }
      return;
    }
    
    console.log('\n--- Starting execution ---');
    
    let successCount = 0;
    let failCount = 0;
    let manualInterventionNeeded = false;
    
    for (const file of matchingFiles) {
      const success = await executeSqlFile(file.path, `${file.category}/${file.name}`);
      if (success) {
        successCount++;
      } else {
        failCount++;
        manualInterventionNeeded = true;
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`✅ Successfully executed: ${successCount} files`);
    console.log(`⚠️  Requires manual execution: ${failCount} files`);
    console.log(`📊 Total: ${matchingFiles.length} files`);
    
    if (manualInterventionNeeded) {
      console.log('\n🔧 NEXT STEPS:');
      console.log('   1. Copy the SQL statements shown above');
      console.log('   2. Go to your Supabase project SQL Editor');  
      console.log('   3. Paste and execute the SQL manually');
      console.log('   4. Verify the migration completed successfully');
    }
    
  } catch (error) {
    console.error('Specific migration failed:', error);
  }
}

// Function to show usage help
function showUsage() {
  console.log('=== Migration Tool Usage ===');
  console.log('');
  console.log('Commands:');
  console.log('  node run-migration.js                    - Show this help');
  console.log('  node run-migration.js list               - List all available migrations');
  console.log('  node run-migration.js all                - Run ALL migrations');
  console.log('  node run-migration.js <target>           - Run specific migration');
  console.log('  node run-migration.js <target> --show    - Show SQL only (no execution)');
  console.log('');
  console.log('Target examples:');
  console.log('  node run-migration.js init.sql           - Run init.sql');
  console.log('  node run-migration.js 202509050001       - Run all files in folder 202509050001');
  console.log('  node run-migration.js shopping_lists_schema.sql - Run specific file by name');
  console.log('  node run-migration.js 202509050001/shopping_lists_schema.sql - Run specific path');
  console.log('  node run-migration.js init.sql --show    - Just show the SQL content');
  console.log('');
  console.log('Available migrations:');
  
  try {
    const dbPath = path.join(__dirname, 'db');
    const sqlFiles = discoverSqlFiles(dbPath);
    
    const folders = [...new Set(sqlFiles.map(f => f.category))].sort();
    folders.forEach(folder => {
      console.log(`\n  📁 ${folder}/`);
      const folderFiles = sqlFiles.filter(f => f.category === folder);
      folderFiles.forEach(file => {
        console.log(`     📄 ${file.name}`);
      });
    });
  } catch (error) {
    console.error('Error listing migrations:', error.message);
  }
}

// Function to just show SQL content without execution
function showSqlContent(filePath, fileName) {
  console.log(`\n--- SQL Content: ${fileName} ---`);
  
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    console.log('='.repeat(60));
    console.log(sqlContent);
    console.log('='.repeat(60));
    console.log(`\n💡 Copy the SQL above to execute manually in Supabase SQL Editor.`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to read ${fileName}:`, error.message);
    return false;
  }
}

if (require.main === module) {
  const command = process.argv[2];
  const showFlag = process.argv[3] === '--show' || process.argv.includes('--show');
  
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showUsage();
  } else if (command === 'list' || command === '--list') {
    listAllMigrations().then(() => {
      console.log('\nMigration listing completed.');
      process.exit(0);
    });
  } else if (command === 'all' || command === '--all') {
    if (showFlag) {
      console.log('❌ --show flag is not supported with "all" command. Use specific migration names.');
      process.exit(1);
    }
    runAllMigrations().then(() => {
      console.log('\nMigration execution completed.');
      process.exit(0);
    });
  } else {
    // Run specific migration
    runSpecificMigration(command, showFlag).then(() => {
      console.log(`\n${showFlag ? 'SQL display' : 'Specific migration'} completed.`);
      process.exit(0);
    });
  }
}
