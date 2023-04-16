const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

describeMany(
	['createWriteStream', 'sync'],
	
	they('should succeed at creating a WriteStream to goodFile', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);

			// Wait until the stream is ready before ending the test and removing the temp dir,
			// or else the stream throws an error when the file has already been removed.
			const result = await new Promise(resolve => {
				__method__(files.goodFile).then(stream => {
					stream.on('ready', () => resolve(stream));
				});
			});

			unbox();

			assert(result instanceof fs.WriteStream);
		});
	}),
	they('should fail at creating a WriteStream to badFile', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.badFile);
			unbox();

			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
		});
	}),

	they('should succeed with a good link to a good file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);

			// Wait until the stream is ready before ending the test and removing the temp dir,
			// or else the stream throws an error when the file has already been removed.
			const result = await new Promise(resolve => {
				__method__(files.goodToGood).then(stream => {
					stream.on('ready', () => resolve(stream));
				});
			});

			unbox();

			assert(result instanceof fs.WriteStream);
		});
	}),
	they('should succeed with a bad link to a good file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);

			// Wait until the stream is ready before ending the test and removing the temp dir,
			// or else the stream throws an error when the file has already been removed.
			const result = await new Promise(resolve => {
				__method__(files.badToGood).then(stream => {
					stream.on('ready', () => resolve(stream));
				});
			});

			unbox();

			assert(result instanceof fs.WriteStream);
		});
	}),
	they('should fail with a bad link to a bad file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.badToBad);
			unbox();

			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
		});
	}),
	they('should fail with a good link to a bad file', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.goodToBad);
			unbox();

			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
		});
	}),
);
