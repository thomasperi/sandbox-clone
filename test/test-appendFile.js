const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { testAllForms, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

testAllForms({
	method: 'appendFile',
	args: file => [file, ' zote', 'utf8'],
	promises: true,
	callbacks: true,
	synchronous: true,
	assertions: (result) => {
		assert.equal(result, undefined);
	
		const actualNo = fs.readFileSync(disallowedFile, 'utf8');
		const actualYes = fs.readFileSync(allowedFile, 'utf8');
		assert.equal(actualNo, 'no');
		assert.equal(actualYes, 'yes zote');
	},
});
