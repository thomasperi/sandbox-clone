const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { testAllForms, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

testAllForms({
	setup: () => {
		// make both read-only initially
		fs.chmodSync(disallowedFile, 0o400);
		fs.chmodSync(allowedFile, 0o400);
	},
	method: 'chmod',
	args: file => [file, 0o200], // only the allowed one should change to write-only
	promises: true,
	callbacks: true,
	synchronous: true,
	assertions: () => {
		// allowed should be writable now, having been chmod'd to write-only
		fs.accessSync(allowedFile, fs.constants.W_OK);

		// disallowed should still be readable, NOT having been chmod'd to write-only
		fs.accessSync(disallowedFile, fs.constants.R_OK);
	},
});

