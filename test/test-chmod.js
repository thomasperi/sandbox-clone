const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { FAIL, boxed, testFeature, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

const readOnly = 0o400;
const readWrite = 0o600;

testFeature({
	methods: [
		['chmod', 'promise'],
		['chmod', 'callback'],
		['chmodSync', 'sync'],
	],
	attempts: [
	
		// boxed
		async methodProxy => {
			fs.chmodSync(disallowedFile, readWrite);
			
			let result = await boxed(() => methodProxy(disallowedFile, readOnly));
			assert.equal(result, FAIL, 'chmod disallowedFile to read-only while sandboxed should fail');
			
			try {
				fs.accessSync(disallowedFile, fs.constants.W_OK);
			} catch (e) {
				assert.fail('disallowedFile should still be writable after chmod failed when sandboxed');
			}
		},
		async methodProxy => {
			fs.chmodSync(allowedFile, readOnly);
			
			let result = await boxed(() => methodProxy(allowedFile, readWrite));
			assert.equal(result, undefined, 'chmod allowedFile to read-write while sandboxed should succeed');
			
			// File should be writable now because the chmod succeeded
			try {
				fs.accessSync(allowedFile, fs.constants.W_OK);
			} catch (e) {
				assert.fail('chmod allowedFile should be writable after chmod succeeded when sandboxed');
			}
		},

		// not boxed
		async methodProxy => {
			fs.chmodSync(disallowedFile, readOnly);
			
			let result = await methodProxy(disallowedFile, readWrite);
			assert.equal(result, undefined, 'chmod disallowedFile to read-write while not sandboxed should succeed');
			
			// File should be writable now because the chmod succeeded
			try {
				fs.accessSync(disallowedFile, fs.constants.W_OK);
			} catch (e) {
				assert.fail('chmod disallowedFile should be writable after chmod succeeded when not sandboxed');
			}
		},
		async methodProxy => {
			fs.chmodSync(allowedFile, readOnly);
			
			let result = await methodProxy(allowedFile, readWrite);
			assert.equal(result, undefined, 'chmod allowedFile to read-write while not sandboxed should succeed');
			
			// File should be writable now because the chmod succeeded
			try {
				fs.accessSync(allowedFile, fs.constants.W_OK);
			} catch (e) {
				assert.fail('chmod allowedFile should be writable after chmod succeeded when not sandboxed');
			}
		},

	],
});
