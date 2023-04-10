const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { FAIL, boxed, testAllForms, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

const disallowedFileCopy = disallowedFile + '.copy';
const allowedFileCopy = allowedFile + '.copy';

testAllForms({
	method: 'copyFile',
	promises: true,
	callbacks: true,
	synchronous: true,
	attempts: [
		async methodProxy => {
			let result = await boxed(() => methodProxy(disallowedFile, disallowedFileCopy));
			assert.equal(result, FAIL, 'copyFile should fail to copy TO and FROM disallowed files when sandboxed');
			assert(!fs.existsSync(disallowedFileCopy), 'the copy should not exist');
		},
		async methodProxy => {
			let result = await boxed(() => methodProxy(disallowedFile, allowedFileCopy));
			assert.equal(result, FAIL, 'copyFile should fail to copy FROM a disallowed file when sandboxed');
			assert(!fs.existsSync(allowedFileCopy), 'copy should not exist');
		},
		async methodProxy => {
			let result = await boxed(() => methodProxy(allowedFile, disallowedFileCopy));
			assert.equal(result, FAIL, 'copyFile should fail to copy TO a disallowed file when sandboxed');
			assert(!fs.existsSync(disallowedFileCopy), 'copy should not exist');
		},
		async methodProxy => {
			let result = await boxed(() => methodProxy(allowedFile, allowedFileCopy));
			assert.equal(result, undefined, 'copyFile should succeed to copy TO and FROM allowed files when sandboxed');
			assert(fs.existsSync(allowedFileCopy), 'copy should exist');
			assert.equal(fs.readFileSync(allowedFileCopy, 'utf8'), 'yes');
		},
	],
});
