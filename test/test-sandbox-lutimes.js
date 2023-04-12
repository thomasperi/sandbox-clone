const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles, sandboxDir, goodFile, badFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

const goodToGood = `${goodFile}-link-to-good`;
const badToGood = `${badFile}-link-to-good`;
const goodToBad = `${goodFile}-link-to-bad`;
const badToBad = `${badFile}-link-to-bad`;

function makeLinks() {
	fs.symlinkSync(goodFile, goodToGood);
	fs.symlinkSync(goodFile, badToGood);
	fs.symlinkSync(badFile, goodToBad);
	fs.symlinkSync(badFile, badToBad);
}

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
		await withTempFiles(async () => {
			makeLinks();
			
			sandbox(sandboxDir);
			const result = await __method__(goodToGood, atime, mtime);
			unbox();
			
			assert.equal(result, undefined);

			const stat = fs.lstatSync(goodToGood);
			assert.equal(stat.atimeMs, atimeMs);
			assert.equal(stat.mtimeMs, mtimeMs);
		});
	}),

	they('should succeed on a good link to a bad file', async (__method__) => {
		await withTempFiles(async () => {
			makeLinks();
			
			sandbox(sandboxDir);
			const result = await __method__(goodToBad, atime, mtime);
			unbox();
			
			assert.equal(result, undefined);

			const stat = fs.lstatSync(goodToBad);
			assert.equal(stat.atimeMs, atimeMs);
			assert.equal(stat.mtimeMs, mtimeMs);
		});
	}),

	they('should fail on a bad link to a good file', async (__method__) => {
		await withTempFiles(async () => {
			makeLinks();
			const oldStat = fs.lstatSync(badToGood);
			
			sandbox(sandboxDir);
			const result = await __method__(badToGood, atime, mtime);
			unbox();
			
			assert.equal(result.code, 'OUTSIDE_SANDBOX');

			const stat = fs.lstatSync(badToGood);
			assert.equal(stat.atimeMs, oldStat.atimeMs);
			assert.equal(stat.mtimeMs, oldStat.mtimeMs);
		});
	}),

	they('should fail on a bad link to a bad file', async (__method__) => {
		await withTempFiles(async () => {
			makeLinks();
			const oldStat = fs.lstatSync(badToBad);
			
			sandbox(sandboxDir);
			const result = await __method__(badToBad, atime, mtime);
			unbox();
			
			assert.equal(result.code, 'OUTSIDE_SANDBOX');

			const stat = fs.lstatSync(badToBad);
			assert.equal(stat.atimeMs, oldStat.atimeMs);
			assert.equal(stat.mtimeMs, oldStat.mtimeMs);
		});
	}),

);
