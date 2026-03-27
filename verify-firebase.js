// Quick Firebase verification script
const fs = require('fs');
const path = require('path');

console.log('🔍 Firebase Setup Verification\n');

// Check 1: Service Account Key File
const keyPath = path.join(__dirname, 'serviceAccountKey.json');
const keyExists = fs.existsSync(keyPath);

console.log('1. Service Account Key File:');
if (keyExists) {
    console.log('   ✅ Found: serviceAccountKey.json');

    try {
        const keyContent = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        console.log('   ✅ Valid JSON format');
        console.log(`   📋 Project ID: ${keyContent.project_id || 'Not found'}`);
        console.log(`   📋 Client Email: ${keyContent.client_email || 'Not found'}`);

        if (keyContent.project_id === 'ems-pro-base') {
            console.log('   ✅ Correct project (ems-pro-base)');
        } else {
            console.log('   ⚠️  Warning: Project ID does not match ems-pro-base');
        }
    } catch (error) {
        console.log('   ❌ Error reading file:', error.message);
    }
} else {
    console.log('   ❌ Not found: serviceAccountKey.json');
    console.log('   📝 Expected location: demo 6 SEM PROJECT/backed/serviceAccountKey.json');
}

console.log('\n2. Dependencies:');
try {
    require('firebase-admin');
    console.log('   ✅ firebase-admin installed');
} catch (error) {
    console.log('   ❌ firebase-admin not installed');
    console.log('   💡 Run: npm install');
}

try {
    require('express');
    console.log('   ✅ express installed');
} catch (error) {
    console.log('   ❌ express not installed');
}

try {
    require('bcrypt');
    console.log('   ✅ bcrypt installed');
} catch (error) {
    console.log('   ❌ bcrypt not installed');
}

try {
    require('jsonwebtoken');
    console.log('   ✅ jsonwebtoken installed');
} catch (error) {
    console.log('   ❌ jsonwebtoken not installed');
}

console.log('\n3. Next Steps:');
if (!keyExists) {
    console.log('   📥 Download service account key from Firebase Console');
    console.log('   📝 Rename to: serviceAccountKey.json');
    console.log('   📁 Place in: demo 6 SEM PROJECT/backed/');
    console.log('   🔗 Guide: https://console.firebase.google.com/project/ems-pro-base/settings/serviceaccounts/adminsdk');
} else {
    console.log('   ✅ Ready to start server!');
    console.log('   🚀 Run: npm run firebase');
}

console.log('\n' + '='.repeat(50));
