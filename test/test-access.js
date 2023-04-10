const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { testAllForms, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

testAllForms({
	setup: () => {
		fs.chmodSync(disallowedFile, 0o400); // read-only
		fs.chmodSync(allowedFile, 0o200); // write-only
	},
	method: 'access',
	args: file => [file, fs.constants.W_OK],
	promises: true,
	callbacks: true,
	synchronous: true,
});
