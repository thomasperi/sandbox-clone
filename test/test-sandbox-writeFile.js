const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles, isWindows } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

describeMany(
	['writeFile', 'promise'],
	['writeFile', 'callback'],
	['writeFileSync', 'sync'],
	they('should succeed at writing good file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.goodFile, 'zote', 'utf8');
			unbox();
			assert.equal(result, undefined);
			assert.equal(fs.readFileSync(files.goodFile, 'utf8'), 'zote');
		});
	}),
	they('should fail at writing bad file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.badFile, 'zote', 'utf8');
			unbox();
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			assert.equal(fs.readFileSync(files.badFile, 'utf8'), 'bad');
		});
	}),

	they('should succeed at writing good link to good file', async (__method__) => {
		if (isWindows) return;
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.goodToGood, 'zote', 'utf8');
			unbox();
			assert.equal(result, undefined);
			assert.equal(fs.readFileSync(files.goodFile, 'utf8'), 'zote');
		});
	}),
	they('should succeed at writing bad link to good file', async (__method__) => {
		if (isWindows) return;
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.badToGood, 'zote', 'utf8');
			unbox();
			assert.equal(result, undefined);
			assert.equal(fs.readFileSync(files.goodFile, 'utf8'), 'zote');
		});
	}),
	they('should fail at writing good link to bad file', async (__method__) => {
		if (isWindows) return;
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.goodToBad, 'zote', 'utf8');
			unbox();
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			assert.equal(fs.readFileSync(files.badFile, 'utf8'), 'bad');
		});
	}),
	they('should fail at writing bad link bad file', async (__method__) => {
		if (isWindows) return;
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.badToBad, 'zote', 'utf8');
			unbox();
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			assert.equal(fs.readFileSync(files.badFile, 'utf8'), 'bad');
		});
	}),
);
