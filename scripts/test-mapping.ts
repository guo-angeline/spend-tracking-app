import { PLAID_TO_INTERNAL_CATEGORY_MAP } from '../src/lib/category-mapping';

const testCases = [
    { input: 'FOOD_AND_DRINK_RESTAURANT', expected: 'Dining' },
    { input: 'FOOD_AND_DRINK_GROCERIES', expected: 'Groceries' },
    { input: 'TRANSPORTATION_GAS_STATIONS', expected: 'Transportation' },
    { input: 'TRAVEL_FLIGHTS', expected: 'Travel' },
    { input: 'UNKNOWN_CATEGORY_XYZ', expected: undefined },
];

console.log('--- Testing Category Mapping ---');
let passed = 0;
for (const test of testCases) {
    const actual = PLAID_TO_INTERNAL_CATEGORY_MAP[test.input];
    if (actual === test.expected) {
        console.log(`✅ ${test.input} -> ${actual}`);
        passed++;
    } else {
        console.error(`❌ ${test.input} -> Expected ${test.expected}, Got ${actual}`);
    }
}

if (passed === testCases.length) {
    console.log('\nAll mapping tests passed!');
} else {
    console.log(`\n${testCases.length - passed} tests failed.`);
    process.exit(1);
}
