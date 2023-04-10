const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { FAIL, boxed, testAllForms, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

testAllForms({
	method: 'access',
	attempts: [
		// boxed
		async methodProxy => {
			// Accessing the allowed file for read should succeed
			let result = await boxed(() => methodProxy(allowedFile, fs.constants.R_OK));
			assert.equal(result, undefined, 'read access on allowedFile should succeed when sandboxed');
		},
		async methodProxy => {
			let result = await boxed(() => methodProxy(disallowedFile, fs.constants.R_OK));
			assert.equal(result, FAIL, 'read access on disallowedFile should fail when sandboxed');
		},
		
		// not boxed
		async methodProxy => {
			let result = await methodProxy(disallowedFile, fs.constants.R_OK);
			assert.equal(result, undefined, 'read access on disallowedFile should succeed when not sandboxed');
		},
		async methodProxy => {
			let result = await methodProxy(allowedFile, fs.constants.R_OK);
			assert.equal(result, undefined, 'read access on allowedFile should succeed when not sandboxed');
		},
	],
});
