const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { FAIL, boxed, testFeature, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

const path = require('path');
const disallowedSubdir = path.join(path.dirname(disallowedFile), 'disallowed-subdir');
const allowedSubdir = path.join(path.dirname(allowedFile), 'allowed-subdir');

function makeDirs() {
	fs.mkdirSync(disallowedSubdir);
	fs.mkdirSync(allowedSubdir);
}

testFeature({
	methods: [
		['readdir', 'promise'],
		['readdir', 'callback'],
		['readdirSync', 'sync'],
	],
	attempts: [
		async methodProxy => {
			makeDirs();
			let result = await boxed(() => methodProxy(disallowedSubdir));
			assert.equal(result, FAIL, 'readdir should fail for disallowedSubdir');
		},

		async methodProxy => {
			makeDirs();
			let result = await boxed(() => methodProxy(allowedSubdir));
			assert(result instanceof Array, 'readdir should succeed for allowedSubdir');
		},
	],
});
