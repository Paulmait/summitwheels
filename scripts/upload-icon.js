const fs = require('fs');
const path = require('path');

// Read the icon file
const iconPath = path.join(__dirname, '..', 'assets', 'icon-512.png');
const iconBuffer = fs.readFileSync(iconPath);

// Upload to Supabase Storage using REST API
async function uploadIcon() {
  const SUPABASE_URL = 'https://lxgrdhyzgxmfdtbvrhel.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Z3JkaHl6Z3htZmR0YnZyaGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDEyMzIsImV4cCI6MjA4NTcxNzIzMn0.YDPtjpzbst47ZRTpXy_5PrALhSYiCyMEz9eJg55o0ys';

  console.log('Uploading icon to Supabase Storage...');
  console.log('Icon size:', iconBuffer.length, 'bytes');

  // First try to create the bucket
  try {
    const createBucket = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: 'assets',
        name: 'assets',
        public: true
      })
    });
    const bucketResult = await createBucket.json();
    console.log('Bucket creation:', bucketResult.message || bucketResult.error || 'Created');
  } catch (e) {
    console.log('Bucket creation error:', e.message);
  }

  // Upload the icon
  try {
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/assets/icon-512.png`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'image/png',
        'x-upsert': 'true'
      },
      body: iconBuffer
    });

    if (uploadRes.ok) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/assets/icon-512.png`;
      console.log('\n✓ Icon uploaded successfully!');
      console.log('Public URL:', publicUrl);
      return publicUrl;
    } else {
      const err = await uploadRes.text();
      console.log('Upload failed:', uploadRes.status, err);

      console.log('\n--- MANUAL SETUP REQUIRED ---');
      console.log('To add the icon to emails:');
      console.log('1. Go to Supabase Dashboard → Storage');
      console.log('2. Create a new bucket named "assets" (set to Public)');
      console.log('3. Upload the file: assets/icon-512.png');
      console.log('4. The public URL will be:');
      console.log(`   ${SUPABASE_URL}/storage/v1/object/public/assets/icon-512.png`);
    }
  } catch (e) {
    console.log('Upload error:', e.message);
  }
}

uploadIcon().catch(console.error);
