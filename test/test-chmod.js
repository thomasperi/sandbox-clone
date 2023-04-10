const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { FAIL, boxed, testAllForms, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

testAllForms({
	method: 'chmod',
	promises: true,
	callbacks: true,
	synchronous: true,
	attempts: [
		async methodProxy => {
			// Set disallowed read-write initially, then try and fail to make it read-only.
			fs.chmodSync(disallowedFile, 0o600);
			
			let result = await boxed(() => methodProxy(disallowedFile, 0o400));
			assert.equal(result, FAIL, 'chmod disallowedFile to read-only while sandboxed should fail');
			
			try {
				fs.accessSync(allowedFile, fs.constants.W_OK);
			} catch (e) {
				assert.fail('disallowedFile should still be writable after chmod failed');
			}
		},
		async methodProxy => {
			// Set allowed file read-only initially, then make it writable.
			fs.chmodSync(disallowedFile, 0o400);
			
			let result = await boxed(() => methodProxy(allowedFile, 0o600));
			assert.equal(result, undefined, 'chmod allowedFile to read-only while sandboxed should succeed');
			
			// File should now be writable because the chmod succeeded
			try {
				fs.accessSync(allowedFile, fs.constants.W_OK);
			} catch (e) {
				assert.fail('chmod allowedFile should be writable after chmod made it so');
			}
		},
	],
});
