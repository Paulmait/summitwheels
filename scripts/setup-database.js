/**
 * Database Setup and Migration Script
 * Run with: node scripts/setup-database.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lxgrdhyzgxmfdtbvrhel.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Z3JkaHl6Z3htZmR0YnZyaGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDEyMzIsImV4cCI6MjA4NTcxNzIzMn0.YDPtjpzbst47ZRTpXy_5PrALhSYiCyMEz9eJg55o0ys';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTable(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (error) {
    if (error.message.includes('does not exist') || error.code === '42P01') {
      return { exists: false, error: error.message };
    }
    return { exists: false, error: error.message };
  }
  return { exists: true, count: data?.length || 0 };
}

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
  console.log('');

  const tables = [
    'analytics_events',
    'analytics_users',
    'admin_users',
    'reports',
    'daily_metrics'
  ];

  let allExist = true;
  const results = [];

  for (const table of tables) {
    const result = await checkTable(table);
    results.push({ table, ...result });

    if (result.exists) {
      console.log(`✅ ${table} - EXISTS`);
    } else {
      console.log(`❌ ${table} - MISSING (${result.error})`);
      allExist = false;
    }
  }

  console.log('\n' + '='.repeat(50));

  if (allExist) {
    console.log('✅ All tables exist! Database is ready.');
    console.log('\nYou can now use the admin dashboard at http://localhost:3001');
  } else {
    console.log('❌ Some tables are missing!');
    console.log('\n📋 You need to run the SQL schema:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/lxgrdhyzgxmfdtbvrhel/sql/new');
    console.log('   2. Copy contents from: database/schema.sql');
    console.log('   3. Paste and click "Run"');
    console.log('\nOr run this command to copy schema to clipboard:');
    console.log('   cat database/schema.sql | clip');
  }

  return allExist;
}

async function createTestAdmin() {
  console.log('\n🔧 Attempting to create test admin user...');

  // Simple hash function matching the dashboard
  function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(16);
  }

  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      email: 'admin@summitwheels.app',
      password_hash: hashPassword('admin123'),
      name: 'Admin',
      role: 'admin',
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes('duplicate') || error.code === '23505') {
      console.log('ℹ️  Admin user already exists');
      return true;
    }
    console.log('❌ Failed to create admin:', error.message);
    return false;
  }

  console.log('✅ Test admin created:');
  console.log('   Email: admin@summitwheels.app');
  console.log('   Password: admin123');
  return true;
}

async function main() {
  console.log('🚀 Summit Wheels Database Setup\n');
  console.log('='.repeat(50));

  const tablesExist = await testConnection();

  if (tablesExist) {
    await createTestAdmin();
  }

  console.log('\n' + '='.repeat(50));
  console.log('Setup complete!\n');
}

main().catch(console.error);
