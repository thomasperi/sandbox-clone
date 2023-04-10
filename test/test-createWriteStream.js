const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { FAIL, boxed, testFeature, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

testFeature({
	methods: [
		['createWriteStream', 'sync'],
	],
	attempts: [
		async methodProxy => {
			let result = await boxed(() => methodProxy(disallowedFile));
			assert.equal(result, FAIL, 'createWriteStream should fail at creating a WriteStream for disallowedFile when sandboxed');
		},
		async methodProxy => {
			// Wait until the stream is ready before ending the test and removing the temp dir,
			// or else the stream throws an error when the file has already been removed.
			let result = await boxed(() => new Promise(resolve => {
				methodProxy(allowedFile).then(stream => {
					stream.on('ready', () => resolve(stream));
				});
			}));
			assert(result instanceof fs.WriteStream, 'createWriteStream should succeed at creating a WriteStream for allowedFile when sandboxed');
		},
	],
});
