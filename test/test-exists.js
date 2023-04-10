const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { FAIL, boxed, testFeature, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

testFeature({
	methods: [
		['exists', 'callback'],
		['existsSync', 'sync'],
	],
	attempts: [
		async methodProxy => {
			let result = await boxed(() => methodProxy(disallowedFile));
			assert.equal(result, FAIL, 'exists should fail for disallowedFile when sandboxed');
		},
		async methodProxy => {
			let result = await boxed(() => methodProxy(`${disallowedFile}.fake`));
			assert.equal(result, FAIL, 'exists should fail for disallowedFile.fake when sandboxed');
		},
		async methodProxy => {
			let result = await boxed(() => methodProxy(allowedFile));
			assert.equal(result, true, 'exists should return true for allowedFile when sandboxed');
		},
		async methodProxy => {
			let result = await boxed(() => methodProxy(`${allowedFile}.fake`));
			assert.equal(result, false, 'exists should return false for allowedFile.fake when sandboxed');
		},
	],
});
