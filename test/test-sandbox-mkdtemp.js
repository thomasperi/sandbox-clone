const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

function prefixes(files) {
	files.badPrefix = files.badFile + '-';
	files.goodPrefix = files.goodFile + '-';
}

describeMany(
	['mkdtemp', 'promise'],
	['mkdtemp', 'callback'],
	['mkdtempSync', 'sync'],
	
	they('should succeed with a good prefix', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			prefixes(files);
			sandbox(sandboxDir);
			const result = await __method__(files.goodPrefix);
			unbox();
			assert.equal(typeof result, 'string');
			assert.equal(result.length, files.goodPrefix.length + 6);
			assert(result.startsWith(files.goodPrefix));
		});
	}),
	they('should succeed with a good prefix even when a link to bad exists', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			prefixes(files);
			fs.symlinkSync(files.badFile, files.goodPrefix);
			sandbox(sandboxDir);
			const result = await __method__(files.goodPrefix);
			unbox();
			assert.equal(typeof result, 'string');
			assert.equal(result.length, files.goodPrefix.length + 6);
			assert(result.startsWith(files.goodPrefix));
		});
	}),
	they('should fail with a bad prefix', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			prefixes(files);
			sandbox(sandboxDir);
			const result = await __method__(files.badPrefix);
			unbox();
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
		});
	}),
);
