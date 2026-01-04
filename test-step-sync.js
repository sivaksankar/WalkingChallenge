// Test script for step sync API endpoint
const fetch = require('node-fetch');

// Sample JWT token payload (you'll need to replace with a real token from your mobile app)
const TEST_TOKEN = 'your_jwt_token_here';

async function testStepSync() {
  console.log('🧪 Testing step sync endpoint...\n');

  const testData = {
    steps: 252,
    date: new Date().toISOString(),
    source: 'apple_health'
  };

  try {
    const response = await fetch('http://localhost:3000/api/steps/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.status === 200) {
      console.log('\n✅ Test PASSED');
    } else {
      console.log('\n❌ Test FAILED');
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Test without token
async function testNoAuth() {
  console.log('\n🧪 Testing without authentication...\n');

  try {
    const response = await fetch('http://localhost:3000/api/steps/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        steps: 100,
        date: new Date().toISOString(),
        source: 'test'
      })
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.status === 401) {
      console.log('\n✅ Auth check PASSED (correctly rejected)');
    } else {
      console.log('\n❌ Auth check FAILED (should reject)');
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run tests
(async () => {
  await testNoAuth();
  console.log('\n' + '='.repeat(50) + '\n');
  
  if (TEST_TOKEN !== 'your_jwt_token_here') {
    await testStepSync();
  } else {
    console.log('⚠️  Skipping authenticated test (no token provided)');
    console.log('To test with auth, replace TEST_TOKEN in the script with a real JWT from the mobile app');
  }
})();
