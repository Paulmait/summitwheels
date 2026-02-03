/**
 * View Security Logs - Enhanced audit log viewer
 */

const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:CncvKm6oweJhZXpf@db.lxgrdhyzgxmfdtbvrhel.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  SUMMIT WHEELS ADMIN - SECURITY AUDIT LOGS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Get recent audit logs
  const logs = await client.query(`
    SELECT action, details, ip_address, user_agent, timestamp
    FROM audit_logs
    ORDER BY timestamp DESC
    LIMIT 15
  `);

  console.log('📋 RECENT SECURITY EVENTS:\n');
  console.log('─'.repeat(70));

  logs.rows.forEach(log => {
    const time = new Date(log.timestamp).toLocaleString();
    const action = log.action.padEnd(20);
    const ip = log.ip_address || 'N/A';
    const details = log.details;

    // Color code by action type
    let icon = '📝';
    if (log.action.includes('LOGIN_SUCCESS')) icon = '✅';
    else if (log.action.includes('LOGIN_FAILED')) icon = '❌';
    else if (log.action.includes('PASSWORD')) icon = '🔑';
    else if (log.action.includes('LOGOUT')) icon = '👋';
    else if (log.action.includes('DEVICE')) icon = '📱';
    else if (log.action.includes('2FA') || log.action.includes('TOTP')) icon = '🔐';

    console.log(`${icon} ${action} | ${time}`);
    console.log(`   IP: ${ip}`);

    if (details.email) console.log(`   User: ${details.email}`);
    if (details.browser) console.log(`   Browser: ${details.browser} on ${details.os}`);
    if (details.location) console.log(`   Location: ${details.location}`);
    if (details.reason) console.log(`   Reason: ${details.reason}`);
    if (details.isNewDevice) console.log(`   ⚠️  NEW DEVICE DETECTED`);

    console.log('─'.repeat(70));
  });

  // Get login devices
  const devices = await client.query(`
    SELECT device_name, device_type, ip_address, location, browser, os,
           last_used_at, is_trusted, created_at
    FROM login_devices
    ORDER BY last_used_at DESC
    LIMIT 10
  `);

  if (devices.rows.length > 0) {
    console.log('\n📱 KNOWN DEVICES:\n');
    devices.rows.forEach(d => {
      const trusted = d.is_trusted ? '✓ Trusted' : '○ Not trusted';
      const lastUsed = new Date(d.last_used_at).toLocaleString();
      console.log(`  ${d.device_name || 'Unknown Device'}`);
      console.log(`    Type: ${d.device_type} | ${trusted}`);
      console.log(`    IP: ${d.ip_address} | Location: ${d.location || 'Unknown'}`);
      console.log(`    Last used: ${lastUsed}`);
      console.log('');
    });
  }

  // Security stats
  const stats = await client.query(`
    SELECT
      COUNT(*) FILTER (WHERE action = 'LOGIN_SUCCESS' AND timestamp > NOW() - INTERVAL '24 hours') as logins_24h,
      COUNT(*) FILTER (WHERE action = 'LOGIN_FAILED' AND timestamp > NOW() - INTERVAL '24 hours') as failed_24h,
      COUNT(*) FILTER (WHERE action = 'PASSWORD_CHANGED' AND timestamp > NOW() - INTERVAL '7 days') as pwd_changes_7d,
      COUNT(*) FILTER (WHERE action = 'NEW_DEVICE_LOGIN' AND timestamp > NOW() - INTERVAL '7 days') as new_devices_7d
    FROM audit_logs
  `);

  const s = stats.rows[0];
  console.log('\n📊 SECURITY SUMMARY (Last 24h/7d):\n');
  console.log(`  Successful logins (24h):  ${s.logins_24h}`);
  console.log(`  Failed logins (24h):      ${s.failed_24h}`);
  console.log(`  Password changes (7d):    ${s.pwd_changes_7d}`);
  console.log(`  New device logins (7d):   ${s.new_devices_7d}`);

  console.log('\n═══════════════════════════════════════════════════════════════════\n');

  await client.end();
}

run().catch(console.error);
