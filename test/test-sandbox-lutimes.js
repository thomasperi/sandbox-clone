const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

// The utimes methods expect atime and mtime to be in seconds,
// but the stat methods return it in milliseconds.
const atimeMs = 2000;
const mtimeMs = 1000;
const atime = atimeMs / 1000;
const mtime = mtimeMs / 1000;


describeMany(
	['lutimes', 'promise'],
	['lutimes', 'callback'],
	['lutimesSync', 'sync'],

	they('should succeed on a good link to a good file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.goodToGood, atime, mtime);
			unbox();
			
			assert.equal(result, undefined);

			const stat = fs.lstatSync(files.goodToGood);
			assert.equal(stat.atimeMs, atimeMs);
			assert.equal(stat.mtimeMs, mtimeMs);
		});
	}),

	they('should succeed on a good link to a bad file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.goodToBad, atime, mtime);
			unbox();
			
			assert.equal(result, undefined);

			const stat = fs.lstatSync(files.goodToBad);
			assert.equal(stat.atimeMs, atimeMs);
			assert.equal(stat.mtimeMs, mtimeMs);
		});
	}),

	they('should fail on a bad link to a good file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			const oldStat = fs.lstatSync(files.badToGood);
			
			sandbox(sandboxDir);
			const result = await __method__(files.badToGood, atime, mtime);
			unbox();
			
			assert.equal(result.code, 'OUTSIDE_SANDBOX');

			const stat = fs.lstatSync(files.badToGood);
			assert.equal(stat.atimeMs, oldStat.atimeMs);
			assert.equal(stat.mtimeMs, oldStat.mtimeMs);
		});
	}),

	they('should fail on a bad link to a bad file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			const oldStat = fs.lstatSync(files.badToBad);
			
			sandbox(sandboxDir);
			const result = await __method__(files.badToBad, atime, mtime);
			unbox();
			
			assert.equal(result.code, 'OUTSIDE_SANDBOX');

			const stat = fs.lstatSync(files.badToBad);
			assert.equal(stat.atimeMs, oldStat.atimeMs);
			assert.equal(stat.mtimeMs, oldStat.mtimeMs);
		});
	}),

);
