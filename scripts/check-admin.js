const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:CncvKm6oweJhZXpf@db.lxgrdhyzgxmfdtbvrhel.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // Check admin users
  const users = await client.query(`
    SELECT id, email, name, role, is_active,
           password_changed_at, totp_enabled, two_factor_enabled,
           failed_login_attempts, locked_until
    FROM admin_users
  `);

  console.log('=== ADMIN USERS ===\n');
  users.rows.forEach(u => {
    console.log(`Email: ${u.email}`);
    console.log(`Name: ${u.name}`);
    console.log(`Role: ${u.role}`);
    console.log(`Active: ${u.is_active}`);
    console.log(`2FA Enabled: ${u.totp_enabled || u.two_factor_enabled || false}`);
    console.log(`Password Changed: ${u.password_changed_at || 'Never'}`);
    console.log(`Failed Attempts: ${u.failed_login_attempts || 0}`);
    console.log(`Locked Until: ${u.locked_until || 'Not locked'}`);
    console.log('');
  });

  // Check recent audit logs
  const logs = await client.query(`
    SELECT action, details, timestamp
    FROM audit_logs
    ORDER BY timestamp DESC
    LIMIT 5
  `);

  console.log('=== RECENT AUDIT LOGS ===\n');
  logs.rows.forEach(l => {
    console.log(`${l.timestamp} - ${l.action}`);
    console.log(`  Details: ${JSON.stringify(l.details)}`);
  });

  await client.end();
}

run().catch(console.error);
