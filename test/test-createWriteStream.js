const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const sandboxFs = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles, sandboxDir, goodFile, badFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

describeMany(
	['createWriteStream', 'sync'],
	
	they('should succeed at creating a WriteStream to goodFile', async (__method__) => {
		await withTempFiles(async () => {
			const unbox = sandboxFs(sandboxDir);

			// Wait until the stream is ready before ending the test and removing the temp dir,
			// or else the stream throws an error when the file has already been removed.
			const result = await new Promise(resolve => {
				__method__(goodFile).then(stream => {
					stream.on('ready', () => resolve(stream));
				});
			});

			unbox();

			assert(result instanceof fs.WriteStream);
		});
	}),

	they('should fail at creating a WriteStream to badFile', async (__method__) => {
		await withTempFiles(async () => {
			const unbox = sandboxFs(sandboxDir);
			const result = await __method__(badFile);
			unbox();

			assert.equal(result.code, 'OUTSIDE_SANDBOX');
		});
	}),
);
