const ViewEngine = require('./src/views/ViewEngine.js');

const viewEngine = new ViewEngine();

console.log('=== Test 1: Simple if condition ===');
const template1 = '{{#if hasUser}}<div>Has user</div>{{/if}}';
const data1 = { hasUser: true };
const result1 = viewEngine.render(template1, data1);
console.log('Template:', template1);
console.log('Data:', JSON.stringify(data1));
console.log('Result:', result1);

console.log('\n=== Test 2: Nested if conditions ===');
const template2 = '{{#if hasUser}}{{#if user.isActive}}<div>Active User: {{user.name}}</div>{{/if}}{{/if}}';
const data2 = {
    hasUser: true,
    user: {
        isActive: true,
        name: 'John Doe'
    }
};
const result2 = viewEngine.render(template2, data2);
console.log('Template:', template2);
console.log('Data:', JSON.stringify(data2));
console.log('Result:', result2);

console.log('\n=== Test 3: Inner if condition only ===');
const template3 = '{{#if user.isActive}}<div>Active User: {{user.name}}</div>{{/if}}';
const data3 = {
    user: {
        isActive: true,
        name: 'John Doe'
    }
};
const result3 = viewEngine.render(template3, data3);
console.log('Template:', template3);
console.log('Data:', JSON.stringify(data3));
console.log('Result:', result3);
