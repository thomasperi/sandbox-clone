const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const sandboxFs = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles, sandboxDir, goodFile, badFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

describeMany(
	['appendFile', 'promise'],
	['appendFile', 'callback'],
	['appendFileSync', 'sync'],
	they('should succeed at appending good file', async (__method__) => {
		await withTempFiles(async () => {
			const unbox = sandboxFs(sandboxDir);
			const result = await __method__(goodFile, ' zote', 'utf8');
			unbox();
			assert.equal(result, undefined);
			assert.equal(fs.readFileSync(goodFile, 'utf8'), 'good zote');
		});
	}),
	they('should fail at appending bad file', async (__method__) => {
		await withTempFiles(async () => {
			const unbox = sandboxFs(sandboxDir);
			const result = await __method__(badFile, ' zote', 'utf8');
			unbox();
			assert.equal(result, 'FAIL');
			assert.equal(fs.readFileSync(badFile, 'utf8'), 'bad');
		});
	}),
);
