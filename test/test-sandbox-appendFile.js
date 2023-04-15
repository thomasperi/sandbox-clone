const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles, sandboxDir, files } = require('../dev/test.js'); // eslint-disable-line no-unused-vars
const { goodFile, badFile, goodToGood, badToGood, goodToBad, badToBad } = files; // eslint-disable-line no-unused-vars

describeMany(
	['appendFile', 'promise'],
	['appendFile', 'callback'],
	['appendFileSync', 'sync'],
	they('should succeed at appending good file', async (__method__) => {
		await withTempFiles(async () => {
			sandbox(sandboxDir);
			const result = await __method__(goodFile, ' zote', 'utf8');
			unbox();
			assert.equal(result, undefined);
			assert.equal(fs.readFileSync(goodFile, 'utf8'), 'good zote');
		});
	}),
	they('should fail at appending bad file', async (__method__) => {
		await withTempFiles(async () => {
			sandbox(sandboxDir);
			const result = await __method__(badFile, ' zote', 'utf8');
			unbox();
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			assert.equal(fs.readFileSync(badFile, 'utf8'), 'bad');
		});
	}),

	they('should succeed at appending good link to good file', async (__method__) => {
		await withTempFiles(async () => {
			sandbox(sandboxDir);
			const result = await __method__(goodToGood, ' zote', 'utf8');
			unbox();
			assert.equal(result, undefined);
			assert.equal(fs.readFileSync(goodFile, 'utf8'), 'good zote');
		});
	}),
	they('should succeed at appending bad link to good file', async (__method__) => {
		await withTempFiles(async () => {
			sandbox(sandboxDir);
			const result = await __method__(badToGood, ' zote', 'utf8');
			unbox();
			assert.equal(result, undefined);
			assert.equal(fs.readFileSync(goodFile, 'utf8'), 'good zote');
		});
	}),
	they('should fail at appending good link to bad file', async (__method__) => {
		await withTempFiles(async () => {
			sandbox(sandboxDir);
			const result = await __method__(goodToBad, ' zote', 'utf8');
			unbox();
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			assert.equal(fs.readFileSync(badFile, 'utf8'), 'bad');
		});
	}),
	they('should fail at appending bad link bad file', async (__method__) => {
		await withTempFiles(async () => {
			sandbox(sandboxDir);
			const result = await __method__(badToBad, ' zote', 'utf8');
			unbox();
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			assert.equal(fs.readFileSync(badFile, 'utf8'), 'bad');
		});
	}),
);
