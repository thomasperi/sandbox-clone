const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { FAIL, boxed, testAllForms, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

testAllForms({
	method: 'appendFile',
	promises: true,
	callbacks: true,
	synchronous: true,
	attempts: [
		async methodProxy => {
			let result = await boxed(() => methodProxy(disallowedFile, ' zote', 'utf8'));
			let content = fs.readFileSync(disallowedFile, 'utf8');
			assert.equal(result, FAIL, 'appendFile should fail to write disallowedFile when sandboxed');
			assert.equal(content, 'no', 'content of disallowedFile should still be the unappended default');
		},
		async methodProxy => {
			let result = await boxed(() => methodProxy(allowedFile, ' zote', 'utf8'));
			let content = fs.readFileSync(allowedFile, 'utf8');
			assert.equal(result, undefined);
			assert.equal(content, 'yes zote', 'content of allowedFile should be appended now');
		},
	],
});
