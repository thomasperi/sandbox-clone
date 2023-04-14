const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles, sandboxDir, files } = require('../dev/test.js'); // eslint-disable-line no-unused-vars
const { goodFile, badFile, goodToGood, badToGood, goodToBad, badToBad } = files; // eslint-disable-line no-unused-vars

const readOnly = 0o400;
const readWrite = 0o600;

const writeOK = fs.constants.W_OK;

describeMany(
	['chmod', 'promise'],
	['chmod', 'callback'],
	['chmodSync', 'sync'],
	they('should succeed at changing mode of good file', async (__method__) => {
		await withTempFiles(async () => {
			fs.chmodSync(goodFile, readOnly);

			sandbox(sandboxDir);
			const result = await __method__(goodFile, readWrite);
			unbox();

			assert.equal(result, undefined);
			try {
				fs.accessSync(goodFile, writeOK);
			} catch (e) {
				assert.fail('goodFile should be writable after read-write chmod succeeded');
			}

		});
	}),
	they('should fail at changing mode of bad file', async (__method__) => {
		await withTempFiles(async () => {
			fs.chmodSync(badFile, readWrite);

			sandbox(sandboxDir);
			const result = await __method__(badFile, readOnly);
			unbox();

			assert.equal(result.code, 'OUTSIDE_SANDBOX');
			try {
				fs.accessSync(badFile, writeOK);
			} catch (e) {
				assert.fail('badFile should remain writable after read-only chmod failed');
			}

		});
	}),
);
