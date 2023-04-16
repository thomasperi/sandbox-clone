const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

describeMany(
	['truncate', 'promise'],
	['truncate', 'callback'],
	['truncateSync', 'sync'],
	they('should succeed at truncating good file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.goodFile);
			unbox();
			assert.equal(result, undefined);
			assert.equal(fs.readFileSync(files.goodFile, 'utf8'), '');
		});
	}),
	they('should fail at truncating bad file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.badFile);
			unbox();
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			assert.equal(fs.readFileSync(files.badFile, 'utf8'), 'bad');
		});
	}),

	they('should succeed at truncating good link to good file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.goodToGood);
			unbox();
			assert.equal(result, undefined);
			assert.equal(fs.readFileSync(files.goodFile, 'utf8'), '');
		});
	}),
	they('should succeed at truncating bad link to good file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.badToGood);
			unbox();
			assert.equal(result, undefined);
			assert.equal(fs.readFileSync(files.goodFile, 'utf8'), '');
		});
	}),
	they('should fail at truncating good link to bad file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.goodToBad);
			unbox();
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			assert.equal(fs.readFileSync(files.badFile, 'utf8'), 'bad');
		});
	}),
	they('should fail at truncating bad link bad file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.badToBad);
			unbox();
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			assert.equal(fs.readFileSync(files.badFile, 'utf8'), 'bad');
		});
	}),
);
