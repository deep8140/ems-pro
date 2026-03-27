// Quick backend health check
const http = require('http');

console.log('🔍 Checking backend server...\n');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
    timeout: 3000
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('✅ Backend server is running!');
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`📋 Response: ${data}`);
        console.log('\n✅ Backend is healthy and ready to accept requests.');
    });
});

req.on('error', (error) => {
    console.log('❌ Backend server is NOT running!');
    console.log(`📋 Error: ${error.message}`);
    console.log('\n🔧 To fix this:');
    console.log('1. Make sure you have serviceAccountKey.json in the backed/ folder');
    console.log('2. Run: npm run firebase');
    console.log('3. Wait for "🚀 EMS Server running" message');
    console.log('\n📚 See SETUP-SERVICE-ACCOUNT.md for help');
});

req.on('timeout', () => {
    console.log('⏱️ Backend server timeout!');
    console.log('Server might be starting or not responding.');
    req.destroy();
});

req.end();
