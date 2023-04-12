const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const sandboxFs = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles, sandboxDir, goodFile, badFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

const goodFileNew = goodFile + '-copy';
const badFileNew = badFile + '-copy';

// copyFile, cp, link, and symlink all have the same relationship between their
// path parameters and the files they create, so they can be tested together.
describeMany(
	['copyFile', 'promise'],
	['copyFile', 'callback'],
	['copyFileSync', 'sync'],

	['cp', 'promise'],
	['cp', 'callback'],
	['cpSync', 'sync'],

	['link', 'promise'],
	['link', 'callback'],
	['linkSync', 'sync'],

	['symlink', 'promise'],
	['symlink', 'callback'],
	['symlinkSync', 'sync'],

	they('should succeed at goodFile -> goodFileNew', async (__method__) => {
		await withTempFiles(async () => {
			const unbox = sandboxFs(sandboxDir);
			const result = await __method__(goodFile, goodFileNew);
			unbox();
			
			assert.equal(result, undefined);
			assert.equal(fs.readFileSync(goodFileNew, 'utf8'), 'good');
		});
	}),
	they('should succeed at badFile -> goodFileNew', async (__method__) => {
		await withTempFiles(async () => {
			const unbox = sandboxFs(sandboxDir);
			const result = await __method__(badFile, goodFileNew);
			unbox();
			
			assert.equal(result, undefined);
			assert.equal(fs.readFileSync(goodFileNew, 'utf8'), 'bad');
		});
	}),
	they('should fail at goodFile -> badFileNew', async (__method__) => {
		await withTempFiles(async () => {
			const unbox = sandboxFs(sandboxDir);
			const result = await __method__(goodFile, badFileNew);
			unbox();
			assert.equal(result.code, 'OUTSIDE_SANDBOX');
			assert(!fs.existsSync(badFileNew));
		});
	}),
	they('should fail at badFile -> badFileNew', async (__method__) => {
		await withTempFiles(async () => {
			const unbox = sandboxFs(sandboxDir);
			const result = await __method__(badFile, badFileNew);
			unbox();
			
			assert.equal(result.code, 'OUTSIDE_SANDBOX');
			assert(!fs.existsSync(badFileNew));
		});
	}),
);

// Use copyFile to test whether 3rd arguments get successfully passed through 2-path methods.
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
			
			assert.equal(result.code, 'EEXIST');
			assert.equal(fs.readFileSync(goodFileNew, 'utf8'), 'existing');
		});
	}),
);
