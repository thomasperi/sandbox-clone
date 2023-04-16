const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

const readOnly = 0o400;
const readWrite = 0o600;

const writeOK = fs.constants.W_OK;

describeMany(
	['chmod', 'promise'],
	['chmod', 'callback'],
	['chmodSync', 'sync'],
	they('should succeed at changing mode of good file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			fs.chmodSync(files.goodFile, readOnly);

			sandbox(sandboxDir);
			const result = await __method__(files.goodFile, readWrite);
			unbox();

			assert.equal(result, undefined);
			try {
				fs.accessSync(files.goodFile, writeOK);
			} catch (e) {
				assert.fail('goodFile should be writable after read-write chmod succeeded');
			}

		});
	}),
	they('should fail at changing mode of bad file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			fs.chmodSync(files.badFile, readWrite);

			sandbox(sandboxDir);
			const result = await __method__(files.badFile, readOnly);
			unbox();

			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			try {
				fs.accessSync(files.badFile, writeOK);
			} catch (e) {
				assert.fail('badFile should remain writable after read-only chmod failed');
			}

		});
	}),

	they('should succeed at changing mode of good link to good file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			fs.chmodSync(files.goodFile, readOnly);

			sandbox(sandboxDir);
			const result = await __method__(files.goodToGood, readWrite);
			unbox();

			assert.equal(result, undefined);
			try {
				fs.accessSync(files.goodFile, writeOK);
			} catch (e) {
				assert.fail('goodFile should be writable after read-write chmod succeeded');
			}

		});
	}),
	they('should succeed at changing mode of bad link to good file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			fs.chmodSync(files.goodFile, readOnly);

			sandbox(sandboxDir);
			const result = await __method__(files.badToGood, readWrite);
			unbox();

			assert.equal(result, undefined);
			try {
				fs.accessSync(files.goodFile, writeOK);
			} catch (e) {
				assert.fail('goodFile should be writable after read-write chmod succeeded');
			}

		});
	}),
	they('should fail at changing mode of good link to bad file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			fs.chmodSync(files.badFile, readWrite);

			sandbox(sandboxDir);
			const result = await __method__(files.goodToBad, readOnly);
			unbox();

			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			try {
				fs.accessSync(files.badFile, writeOK);
			} catch (e) {
				assert.fail('badFile should remain writable after read-only chmod failed');
			}

		});
	}),
	they('should fail at changing mode of bad link to bad file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			fs.chmodSync(files.badFile, readWrite);

			sandbox(sandboxDir);
			const result = await __method__(files.badToBad, readOnly);
			unbox();

			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			try {
				fs.accessSync(files.badFile, writeOK);
			} catch (e) {
				assert.fail('badFile should remain writable after read-only chmod failed');
			}

		});
	}),
);
