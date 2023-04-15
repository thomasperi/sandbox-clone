const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles, sandboxDir, goodFile, badFile, goodLink, badLink } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

describeMany(
	['rename', 'promise'],
	['rename', 'callback'],
	['renameSync', 'sync'],

	they('should succeed at opening a good file for reading with no flag', async (__method__, type) => {
		await withTempFiles(async () => {
			sandbox(sandboxDir);
			const result = await __method__(goodFile);
			unbox();
			
			await assertResultType(result, type);
			await closeResult(result);
		});
	}),
);
