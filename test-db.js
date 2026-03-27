// Test database connection and check if employees exist
process.noDeprecation = true;

const { firebaseDB } = require('./firebase-database');

async function testDatabase() {
    console.log('🔍 Testing Firebase Database...\n');

    try {
        // Test 1: Get all employees
        console.log('Test 1: Getting all employees...');
        const employees = await firebaseDB.getEmployees();
        console.log(`✅ Found ${employees.length} employees`);

        if (employees.length > 0) {
            console.log('\nEmployees:');
            employees.forEach(emp => {
                console.log(`  - ${emp.id}: ${emp.name} (${emp.role})`);
            });
        } else {
            console.log('⚠️  No employees found in database!');
            console.log('   Run the server to initialize demo data.');
        }

        // Test 2: Get specific employee
        console.log('\nTest 2: Getting ADMIN001...');
        const admin = await firebaseDB.getEmployeeById('ADMIN001');
        if (admin) {
            console.log(`✅ Found: ${admin.name}`);
            console.log(`   Email: ${admin.email}`);
            console.log(`   Role: ${admin.role}`);
            console.log(`   Has password_hash: ${admin.password_hash ? 'Yes' : 'No'}`);
        } else {
            console.log('❌ ADMIN001 not found!');
        }

        // Test 3: Get EMP001
        console.log('\nTest 3: Getting EMP001...');
        const emp = await firebaseDB.getEmployeeById('EMP001');
        if (emp) {
            console.log(`✅ Found: ${emp.name}`);
            console.log(`   Email: ${emp.email}`);
            console.log(`   Role: ${emp.role}`);
        } else {
            console.log('❌ EMP001 not found!');
        }

        console.log('\n✅ Database test complete!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Database test failed!');
        console.error('Error:', error.message);
        console.error('\nMake sure:');
        console.error('1. serviceAccountKey.json exists in backed/ folder');
        console.error('2. Firestore is enabled in Firebase Console');
        console.error('3. Firestore rules allow access');
        process.exit(1);
    }
}

testDatabase();
