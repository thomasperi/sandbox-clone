const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { FAIL, boxed, testFeature, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

testFeature({
	methods: [
		['open', 'promise'],
		// fs.open and fs.openSync provide an integer file descriptor, not a FileHandle
	],
	attempts: [
		async methodProxy => {
			let result = await boxed(() => methodProxy(disallowedFile));
			assert.equal(result, FAIL, 'open should fail on disallowedFile');
		},
		async methodProxy => {
			let dis = await methodProxy(disallowedFile);
			dis.close();
			const FileHandle = dis.constructor;
			
			let result = await boxed(() => methodProxy(allowedFile));
			assert(result instanceof FileHandle, 'fs.promises.open should provide a FileHandle');
			result.close();
		},
	],
});
