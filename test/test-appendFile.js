const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { FAIL, boxed, testAllForms, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

testAllForms({
	method: 'appendFile',
	attempts: [
		// boxed
		async methodProxy => {
			let result = await boxed(() => methodProxy(disallowedFile, ' zote', 'utf8'));
			let content = fs.readFileSync(disallowedFile, 'utf8');
			assert.equal(result, FAIL, 'appendFile should fail at writing disallowedFile when sandboxed');
			assert.equal(content, 'no', 'content of disallowedFile should be unchanged when sandboxed');
		},
		async methodProxy => {
			let result = await boxed(() => methodProxy(allowedFile, ' zote', 'utf8'));
			let content = fs.readFileSync(allowedFile, 'utf8');
			assert.equal(result, undefined, 'appendFile should succeed at writing allowedFile when sandboxed');
			assert.equal(content, 'yes zote', 'content of allowedFile should be changed when sandboxed');
		},

		// not boxed
		async methodProxy => {
			let result = await methodProxy(disallowedFile, ' zote', 'utf8');
			let content = fs.readFileSync(disallowedFile, 'utf8');
			assert.equal(result, undefined, 'appendFile should succeed at writing disallowedFile when not sandboxed');
			assert.equal(content, 'no zote', 'content of disallowedFile should be changed when not sandboxed');
		},
		async methodProxy => {
			let result = await methodProxy(allowedFile, ' zote', 'utf8');
			let content = fs.readFileSync(allowedFile, 'utf8');
			assert.equal(result, undefined, 'appendFile should succeed at writing allowedFile when not sandboxed');
			assert.equal(content, 'yes zote', 'content of allowedFile should be changed when not sandboxed');
		},
	],
});
