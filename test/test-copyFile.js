const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { FAIL, boxed, testAllForms, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

const disallowedFileCopy = disallowedFile + '.copy';
const allowedFileCopy = allowedFile + '.copy';

testAllForms({
	method: 'copyFile',
	attempts: [
		// boxed
		async methodProxy => {
			let result = await boxed(() => methodProxy(disallowedFile, disallowedFileCopy));
			assert.equal(result, FAIL, 'copyFile from disallowedFile to disallowedFileCopy should fail when sandboxed');
			assert(!fs.existsSync(disallowedFileCopy), 'the copy from disallowed to disallowed should not exist');
		},
		async methodProxy => {
			let result = await boxed(() => methodProxy(disallowedFile, allowedFileCopy));
			assert.equal(result, FAIL, 'copyFile from disallowedFile to allowedFileCopy should fail when sandboxed');
			assert(!fs.existsSync(allowedFileCopy), 'the copy from disallowedFile to allowedFileCopy should not exist');
		},
		async methodProxy => {
			let result = await boxed(() => methodProxy(allowedFile, disallowedFileCopy));
			assert.equal(result, FAIL, 'copyFile from allowedFile to disallowedFileCopy should fail when sandboxed');
			assert(!fs.existsSync(disallowedFileCopy), 'the copy from allowedFile to disallowedFileCopy should not exist');
		},
		async methodProxy => {
			let result = await boxed(() => methodProxy(allowedFile, allowedFileCopy));
			assert.equal(result, undefined, 'copyFile from allowedFile to allowedFileCopy should succeed when sandboxed');
			assert.equal(fs.readFileSync(allowedFileCopy, 'utf8'), 'yes', 'allowedFileCopy should contain the contents of allowedFile');
		},
	],
});
