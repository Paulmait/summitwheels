const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:CncvKm6oweJhZXpf@db.lxgrdhyzgxmfdtbvrhel.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  SUPABASE SECURITY CHECK');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Check functions for search_path
  console.log('📋 FUNCTION SEARCH_PATH CHECK:\n');

  const functions = await client.query(`
    SELECT
      p.proname as name,
      p.proconfig as config
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
      'check_password_history',
      'save_password_history',
      'cleanup_expired_tokens',
      'cleanup_old_rate_limits',
      'check_password_expiry',
      'detect_suspicious_purchase',
      'update_user_stats'
    )
    ORDER BY p.proname;
  `);

  let fixedFunctions = 0;
  functions.rows.forEach(f => {
    const hasSearchPath = f.config && f.config.some(c => c.includes('search_path'));
    const status = hasSearchPath ? '✅ FIXED' : '❌ NEEDS FIX';
    if (hasSearchPath) fixedFunctions++;
    console.log(`  ${status}: ${f.name}`);
    if (f.config) {
      f.config.forEach(c => console.log(`          → ${c}`));
    }
  });

  // Check RLS policies
  console.log('\n📋 RLS POLICY CHECK:\n');

  const policies = await client.query(`
    SELECT
      tablename,
      policyname,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);

  let currentTable = '';
  let restrictedPolicies = 0;
  let totalPolicies = 0;

  policies.rows.forEach(p => {
    if (p.tablename !== currentTable) {
      currentTable = p.tablename;
      console.log(`\n  📁 ${p.tablename}`);
    }

    totalPolicies++;
    const isFullyOpen = p.qual === 'true' && p.with_check === 'true' && p.roles.includes('-');
    const hasRoleRestriction = !p.roles.includes('-');

    let status = '✅';
    if (isFullyOpen) {
      status = '⚠️ OPEN';
    } else if (hasRoleRestriction) {
      status = '✅ ROLE-RESTRICTED';
      restrictedPolicies++;
    } else {
      restrictedPolicies++;
    }

    const rolesDisplay = p.roles.replace('{', '').replace('}', '');
    console.log(`     ${status}: ${p.policyname}`);
    console.log(`              Cmd: ${p.cmd} | Roles: ${rolesDisplay}`);
  });

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  console.log(`  Functions with search_path: ${fixedFunctions}/${functions.rows.length}`);
  console.log(`  Policies checked: ${totalPolicies}`);

  if (fixedFunctions === functions.rows.length) {
    console.log('\n  ✅ All function search_path warnings should be resolved!');
  } else {
    console.log(`\n  ⚠️ ${functions.rows.length - fixedFunctions} functions still need search_path fix`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════════\n');
  console.log('💡 Refresh the Supabase Dashboard to see updated linter results.');
  console.log('   Go to: Database → Linter → Re-run checks\n');

  await client.end();
}

run().catch(console.error);
