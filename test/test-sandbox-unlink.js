const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

describeMany(
	['unlink', 'promise'],
	['unlink', 'callback'],
	['unlinkSync', 'sync'],
	
	they('should succeed at unlinking a good file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.goodFile);
			unbox();
			assert.equal(result, undefined);
			assert(!fs.existsSync(files.goodFile));
		});
	}),
	they('should fail at unlinking a bad file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.badFile);
			unbox();
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			assert(fs.existsSync(files.badFile));
		});
	}),

	they('should succeed at unlinking a good link to a good file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.goodToGood);
			unbox();
			assert.equal(result, undefined);
			assert(!fs.existsSync(files.goodToGood));
		});
	}),
	they('should succeed at unlinking a good link to a bad file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.goodToBad);
			unbox();
			assert.equal(result, undefined);
			assert(!fs.existsSync(files.goodToBad));
		});
	}),
	
	they('should fail at unlinking a bad link to a good file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.badToGood);
			unbox();
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			assert(fs.existsSync(files.badToGood));
		});
	}),
	they('should fail at unlinking a bad link to a bad file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.badToBad);
			unbox();
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			assert(fs.existsSync(files.badToBad));
		});
	}),

);
