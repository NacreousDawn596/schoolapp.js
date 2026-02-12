/**
 * Comprehensive test suite for SchoolApp.js
 */
const { SchoolAppClient } = require('./index.js');

console.log('🧪 SchoolApp.js Test Suite\n');
console.log('='.repeat(50));

// Test 1: Package imports
console.log('\n📦 Test 1: Package Imports');
try {
    console.log('   ✅ SchoolAppClient imported successfully');
} catch (error) {
    console.error('   ❌ FAILED:', error.message);
    process.exit(1);
}

// Test 2: Client instantiation
console.log('\n🔧 Test 2: Client Instantiation');
try {
    const client = new SchoolAppClient();
    console.log('   ✅ Client created successfully');
    console.log(`   📍 Base URL: ${client.baseUrl}`);
} catch (error) {
    console.error('   ❌ FAILED:', error.message);
    process.exit(1);
}

// Test 3: Managers availability
console.log('\n👔 Test 3: Manager Availability');
try {
    const client = new SchoolAppClient();
    const managers = {
        'Grades Manager': client.grades,
        'Attendance Manager': client.attendance,
        'Profile Manager': client.profile,
        'Course Manager': client.courses
    };

    for (const [name, manager] of Object.entries(managers)) {
        if (manager) {
            console.log(`   ✅ ${name} available`);
        } else {
            throw new Error(`${name} not found`);
        }
    }
} catch (error) {
    console.error('   ❌ FAILED:', error.message);
    process.exit(1);
}

// Test 4: API methods
console.log('\n🎯 Test 4: API Methods');
try {
    const client = new SchoolAppClient();
    const methods = [
        'login', 'getProfile', 'getFilieres', 'getAbsences',
        'getSanctions', 'getElemNote', 'getCurrentElemNote',
        'getModNote', 'getCurrentModNote', 'getAnnee',
        'getSemestre', 'getModules'
    ];

    for (const method of methods) {
        if (typeof client[method] === 'function') {
            console.log(`   ✅ ${method}()`);
        } else {
            throw new Error(`Method ${method} not found`);
        }
    }
} catch (error) {
    console.error('   ❌ FAILED:', error.message);
    process.exit(1);
}

// Test 5: Manager methods
console.log('\n📊 Test 5: Manager Methods');
try {
    const client = new SchoolAppClient();

    // Grades manager
    if (typeof client.grades.getElementNotes === 'function' &&
        typeof client.grades.getModuleNotes === 'function' &&
        typeof client.grades.getYears === 'function' &&
        typeof client.grades.getSemesters === 'function') {
        console.log('   ✅ Grades Manager methods');
    } else {
        throw new Error('Grades Manager methods missing');
    }

    // Attendance manager
    if (typeof client.attendance.getAbsences === 'function' &&
        typeof client.attendance.getSanctions === 'function') {
        console.log('   ✅ Attendance Manager methods');
    } else {
        throw new Error('Attendance Manager methods missing');
    }

    // Profile manager
    if (typeof client.profile.getProfile === 'function' &&
        typeof client.profile.getFilieres === 'function') {
        console.log('   ✅ Profile Manager methods');
    } else {
        throw new Error('Profile Manager methods missing');
    }

    // Course manager
    if (typeof client.courses.getModules === 'function') {
        console.log('   ✅ Course Manager methods');
    } else {
        throw new Error('Course Manager methods missing');
    }
} catch (error) {
    console.error('   ❌ FAILED:', error.message);
    process.exit(1);
}

// Test 6: Type classes
console.log('\n🏷️  Test 6: Type Classes');
try {
    const { Element, Module, Annee, Semestre } = require('./src/types/index.js');

    if (Element && Module && Annee && Semestre) {
        console.log('   ✅ All type classes available');
        console.log('      - Element');
        console.log('      - Module');
        console.log('      - Annee');
        console.log('      - Semestre');
    } else {
        throw new Error('Some type classes missing');
    }
} catch (error) {
    console.error('   ❌ FAILED:', error.message);
    process.exit(1);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('🎉 ALL TESTS PASSED!');
console.log('\n✨ SchoolApp.js is ready to use!');
console.log('\n📚 Next steps:');
console.log('   1. Update examples/basic_usage.js with your credentials');
console.log('   2. Run: node examples/basic_usage.js');
console.log('   3. Start building your application!');
console.log('\n' + '='.repeat(50) + '\n');
