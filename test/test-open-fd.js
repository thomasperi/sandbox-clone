const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { FAIL, boxed, testFeature, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

testFeature({
	methods: [
		// The promise version of open resolves to a FileHandle, not an integer file descriptor.
		['open', 'callback'],
		['openSync', 'sync'],
	],
	attempts: [
		async methodProxy => {
			let result = await boxed(() => methodProxy(disallowedFile));
			assert.equal(result, FAIL, 'open should fail on disallowedFile');
		},
		async methodProxy => {
			let result = await boxed(() => methodProxy(allowedFile));
			assert.equal(typeof result, 'number', 'fs.open and fs.openSync should provide an integer file descriptor');
			fs.closeSync(result);
		},
	],
});
