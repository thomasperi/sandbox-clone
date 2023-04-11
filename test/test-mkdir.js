const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { FAIL, boxed, testFeature, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

const path = require('path');
const disallowedSubdir = path.join(path.dirname(disallowedFile), 'disallowed-subdir');
const allowedSubdir = path.join(path.dirname(allowedFile), 'allowed-subdir');

testFeature({
	methods: [
		['mkdir', 'promise'],
		['mkdir', 'callback'],
		['mkdirSync', 'sync'],
	],
	attempts: [
		async methodProxy => {
			let result = await boxed(() => methodProxy(disallowedSubdir));
			assert.equal(result, FAIL, 'mkdir should fail for disallowedSubdir');
			assert(!fs.existsSync(disallowedSubdir), 'disallowedSubdir should not exist');
		},
		async methodProxy => {
			let result = await boxed(() => methodProxy(allowedSubdir));
			assert.equal(result, undefined, 'mkdir should succeed for allowedSubdir');
			assert(fs.existsSync(allowedSubdir), 'allowedSubdir should exist');
			assert(fs.statSync(allowedSubdir).isDirectory(), 'allowedSubdir should be a directory');
		},
	],
});
