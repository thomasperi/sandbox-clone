const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { FAIL, boxed, testFeature, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

testFeature({
	methods: [
		['readFile', 'promise'],
		['readFile', 'callback'],
		['readFileSync', 'sync'],
	],
	attempts: [
		async methodProxy => {
			let result = await boxed(() => methodProxy(disallowedFile));
			assert.equal(result, FAIL, 'readFile should fail for disallowedFile');
		},

		async methodProxy => {
			let result = await boxed(() => methodProxy(allowedFile));
			assert.equal(result, 'yes', 'readFile should succeed for allowedFile');
		},
	],
});
