const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { FAIL, boxed, testFeature, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

testFeature({
	methods: [
		['openAsBlob', 'sync'],
	],
	attempts: [
		async methodProxy => {
			let result = await boxed(() => methodProxy(disallowedFile));
			assert.equal(result, FAIL, 'openAsBlob should fail on disallowedFile');
		},

		async methodProxy => {
			let result = await boxed(() => methodProxy(allowedFile));
			assert(result instanceof Blob, 'openAsBlob should succeed on allowedFile and return a Blob');
		},
	],
});
