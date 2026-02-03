/**
 * Database Migration Script
 *
 * Usage:
 *   SET SUPABASE_ACCESS_TOKEN=your_token_here
 *   node scripts/run-migration.js
 *
 * Or pass token as argument:
 *   node scripts/run-migration.js your_token_here
 */

const { execSync } = require('child_process');
const path = require('path');

const PROJECT_REF = 'lxgrdhyzgxmfdtbvrhel';
const token = process.argv[2] || process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.log('❌ No access token provided!');
  console.log('');
  console.log('To get a token:');
  console.log('1. Go to: https://supabase.com/dashboard/account/tokens');
  console.log('2. Click "Generate new token"');
  console.log('3. Copy the token');
  console.log('');
  console.log('Then run:');
  console.log('  SET SUPABASE_ACCESS_TOKEN=your_token_here');
  console.log('  node scripts/run-migration.js');
  console.log('');
  console.log('Or:');
  console.log('  node scripts/run-migration.js your_token_here');
  process.exit(1);
}

console.log('🚀 Summit Wheels Database Migration\n');
console.log('='.repeat(50));

try {
  // Link the project
  console.log('📡 Linking to Supabase project...');
  execSync(`npx supabase link --project-ref ${PROJECT_REF}`, {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
    stdio: 'inherit'
  });

  console.log('\n✅ Project linked successfully!');

  // Push the migration
  console.log('\n📤 Pushing migrations to remote database...');
  execSync('npx supabase db push', {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
    stdio: 'inherit'
  });

  console.log('\n✅ Migration completed successfully!');
  console.log('\n' + '='.repeat(50));
  console.log('Database is ready. You can now use the admin dashboard.');

} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
}
