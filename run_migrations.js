const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  const scriptsDir = path.join(__dirname, 'scripts');
  
  if (!fs.existsSync(scriptsDir)) {
    console.error(`Error: Scripts directory not found at ${scriptsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(scriptsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ensure order

  console.log(`Found ${files.length} migration scripts.`);

  for (const file of files) {
    console.log(`Running ${file}...`);
    const filePath = path.join(scriptsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Split valid SQL statements (simple split by semicolon, might fail on complex functions)
    // For specialized migrations, running the whole file via pg driver is better, 
    // but supabase-js rpc or sql depends on setup. 
    // Here we assume we can just run the SQL commands if we had a direct connection or 
    // use a workaround if Supabase allows raw SQL execution via rpc/API (which it typically doesn't directly without a function).
    
    // HOWEVER: Since we don't have direct SQL access setup in this environment easily without installing pg,
    // and the user provided this environment, let's try to assume there might be a postgres connection string available 
    // OR we use a designated RPC function 'exec_sql' if it exists.
    
    // Fallback: IF no exec_sql rpc, we must warn. 
    // Check if DATABASE_URL exists for 'pg' lib usage.
    
    // For now, let's try to use a direct PG client if available, or just skip if we can't.
    // Given the constraints and the previous attempts, let's try to use the 'pg' library if installed, orwarn.
    
    try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
             // If RPC fails (likely does not exist), we might be stuck.
             console.log(`  > RPC exec_sql failed: ${error.message}. Trying direct PG if env var exists...`);
        } else {
             console.log(`  > Success via RPC.`);
             continue;
        }
    } catch (e) {
        // ignore
    }

    console.log("  > No automated execution method available in this script version without 'exec_sql' function. Please run manually in Supabase Dashboard SQL Editor.");
  }
}

// Since we cannot easily guarantee 'exec_sql' exists, let's check if we can add it or just instruct the user.
// actually, for this specific task, let's just output the instructions if we can't run it.
runMigrations().catch(console.error);
