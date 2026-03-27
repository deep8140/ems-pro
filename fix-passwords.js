// Fix missing password hashes for all employees
process.noDeprecation = true;

const bcrypt = require('bcrypt');
const { firebaseDB } = require('./firebase-database');

async function fixPasswords() {
    console.log('🔧 Fixing employee passwords...\n');

    try {
        const saltRounds = 10;
        const defaultPassword = 'password';
        const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

        console.log('📊 Getting all employees...');
        const employees = await firebaseDB.getEmployees();
        console.log(`Found ${employees.length} employees\n`);

        let fixed = 0;
        let skipped = 0;

        for (const emp of employees) {
            if (!emp.password_hash) {
                console.log(`🔧 Fixing ${emp.id} (${emp.name})...`);
                await firebaseDB.updateEmployee(emp.id, { password_hash: passwordHash });
                fixed++;
            } else {
                console.log(`✅ ${emp.id} (${emp.name}) - already has password`);
                skipped++;
            }
        }

        console.log(`\n✅ Password fix complete!`);
        console.log(`   Fixed: ${fixed} employees`);
        console.log(`   Skipped: ${skipped} employees (already had passwords)`);
        console.log(`\n🔐 All employees now have password: "password"`);
        console.log(`\nYou can now login with:`);
        console.log(`   ADMIN001 / password`);
        console.log(`   EMP001 / password`);
        console.log(`   (or any other employee ID / password)`);

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Password fix failed!');
        console.error('Error:', error.message);
        process.exit(1);
    }
}

fixPasswords();
