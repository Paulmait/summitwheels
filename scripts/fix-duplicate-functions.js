const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:CncvKm6oweJhZXpf@db.lxgrdhyzgxmfdtbvrhel.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  console.log('Checking for duplicate functions...\n');

  // Find all versions of the problematic functions
  const funcs = await client.query(`
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args, p.proconfig
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN ('check_password_expiry', 'detect_suspicious_purchase')
    ORDER BY p.proname;
  `);

  console.log('Found functions:');
  funcs.rows.forEach(f => {
    const hasPath = f.proconfig && f.proconfig.some(c => c.includes('search_path'));
    console.log(`  ${f.proname}(${f.args || ''}) - has search_path: ${hasPath}`);
  });

  // Drop functions without search_path (old versions)
  console.log('\nDropping old function versions...\n');

  // Drop old check_password_expiry (no args version if exists)
  try {
    await client.query(`DROP FUNCTION IF EXISTS public.check_password_expiry();`);
    console.log('✓ Dropped check_password_expiry() if it existed');
  } catch (e) {
    console.log('Note:', e.message);
  }

  // Drop old detect_suspicious_purchase trigger function
  try {
    // First check if there are multiple versions
    const detectFuncs = await client.query(`
      SELECT pg_get_function_identity_arguments(p.oid) as args, p.proconfig
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'detect_suspicious_purchase';
    `);

    for (const f of detectFuncs.rows) {
      const hasPath = f.proconfig && f.proconfig.some(c => c.includes('search_path'));
      if (!hasPath) {
        console.log(`  Found old version without search_path: detect_suspicious_purchase(${f.args})`);
      }
    }
  } catch (e) {
    console.log('Note:', e.message);
  }

  // Recreate functions with proper search_path
  console.log('\nRecreating functions with search_path...\n');

  // check_password_expiry - make sure only one version exists
  await client.query(`
    DROP FUNCTION IF EXISTS public.check_password_expiry();
    CREATE OR REPLACE FUNCTION public.check_password_expiry()
    RETURNS TABLE(user_id UUID, email VARCHAR, days_until_expiry INTEGER)
    SECURITY DEFINER
    SET search_path = ''
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        au.id,
        au.email,
        EXTRACT(DAY FROM (au.password_changed_at + INTERVAL '180 days' - NOW()))::INTEGER as days_until_expiry
      FROM public.admin_users au
      WHERE au.password_changed_at + INTERVAL '180 days' < NOW() + INTERVAL '30 days';
    END;
    $$ LANGUAGE plpgsql;
  `);
  console.log('✓ Recreated check_password_expiry() with search_path');

  // detect_suspicious_purchase - ensure proper version
  await client.query(`
    CREATE OR REPLACE FUNCTION public.detect_suspicious_purchase()
    RETURNS TRIGGER
    SECURITY DEFINER
    SET search_path = ''
    AS $$
    DECLARE
      recent_count INTEGER;
      total_today NUMERIC;
    BEGIN
      SELECT COUNT(*) INTO recent_count
      FROM public.purchase_logs
      WHERE user_id = NEW.user_id
      AND created_at > NOW() - INTERVAL '1 hour';

      SELECT COALESCE(SUM(amount), 0) INTO total_today
      FROM public.purchase_logs
      WHERE user_id = NEW.user_id
      AND created_at > CURRENT_DATE;

      IF recent_count > 5 OR total_today > 500 THEN
        INSERT INTO public.fraud_flags (user_id, flag_type, severity, details)
        VALUES (
          NEW.user_id,
          'RAPID_PURCHASES',
          CASE WHEN recent_count > 10 OR total_today > 1000 THEN 'HIGH' ELSE 'MEDIUM' END,
          jsonb_build_object(
            'purchases_last_hour', recent_count,
            'total_today', total_today,
            'transaction_id', NEW.transaction_id
          )
        );
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  console.log('✓ Recreated detect_suspicious_purchase() with search_path');

  // Verify
  console.log('\nVerifying...\n');
  const verify = await client.query(`
    SELECT p.proname, p.proconfig
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

  let allFixed = true;
  verify.rows.forEach(f => {
    const hasPath = f.proconfig && f.proconfig.some(c => c.includes('search_path'));
    const status = hasPath ? '✅' : '❌';
    if (!hasPath) allFixed = false;
    console.log(`  ${status} ${f.proname}`);
  });

  console.log('\n' + (allFixed ? '✅ All functions now have search_path set!' : '⚠️ Some functions still need fixing'));

  await client.end();
}

run().catch(console.error);
