const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const sandboxFs = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles, sandboxDir, goodFile, badFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

const goodFileNew = goodFile + '-copy';

// copyFile is already tested elsewhere with other 2-path methods,
// but we can also use it to test whether 3rd parameters get successfully
// passed to 2-path methods.
describeMany(
	['copyFile', 'promise'],
	['copyFile', 'callback'],
	['copyFileSync', 'sync'],
	they('should succeed at overwriting goodFileNew when no mode is specified', async (__method__) => {
		await withTempFiles(async () => {
			fs.writeFileSync(goodFileNew, 'existing', 'utf8');

			const unbox = sandboxFs(sandboxDir);
			const result = await __method__(goodFile, goodFileNew);
			unbox();
			
			assert.equal(result, undefined);
			assert.equal(fs.readFileSync(goodFileNew, 'utf8'), 'good');
		});
	}),
	they('should fail at overwriting goodFileNew when COPYFILE_EXCL mode is specified', async (__method__) => {
		await withTempFiles(async () => {
			fs.writeFileSync(goodFileNew, 'existing', 'utf8');

			const unbox = sandboxFs(sandboxDir);
			const result = await __method__(goodFile, goodFileNew, fs.constants.COPYFILE_EXCL);
			unbox();
			
			assert.equal(result, 'FAIL');
			assert.equal(fs.readFileSync(goodFileNew, 'utf8'), 'existing');
		});
	}),
);
