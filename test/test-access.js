const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const sandboxFs = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles, sandboxDir, goodFile, badFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

describeMany(
	['access', 'promise'],
	['access', 'callback'],
	['accessSync', 'sync'],
	they('should succeed at accessing good file', async (__method__) => {
		await withTempFiles(async () => {
			const unbox = sandboxFs(sandboxDir);
			const result = await __method__(goodFile, fs.constants.R_OK);
			unbox();
			assert.equal(result, undefined);
		});
	}),
	they('should fail at accessing bad file', async (__method__) => {
		await withTempFiles(async () => {
			const unbox = sandboxFs(sandboxDir);
			const result = await __method__(badFile, fs.constants.R_OK);
			unbox();
			assert.equal(result, 'FAIL');
		});
	}),
);
