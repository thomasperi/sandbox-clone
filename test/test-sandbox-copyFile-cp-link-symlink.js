const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

function copies(files) {
	files.goodFileNew = files.goodFile + '-new';
	files.badFileNew = files.badFile + '-new';
}

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
		await withTempFiles(async (sandboxDir, files) => {
			copies(files);
			sandbox(sandboxDir);
			const result = await __method__(files.goodFile, files.goodFileNew);
			unbox();
			
			assert.equal(result, undefined);
			assert.equal(fs.readFileSync(files.goodFileNew, 'utf8'), 'good');
		});
	}),
	they('should succeed at badFile -> goodFileNew', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			copies(files);
			sandbox(sandboxDir);
			const result = await __method__(files.badFile, files.goodFileNew);
			unbox();
			
			assert.equal(result, undefined);
			assert.equal(fs.readFileSync(files.goodFileNew, 'utf8'), 'bad');
		});
	}),
	they('should fail at goodFile -> badFileNew', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			copies(files);
			sandbox(sandboxDir);
			const result = await __method__(files.goodFile, files.badFileNew);
			unbox();
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			assert(!fs.existsSync(files.badFileNew));
		});
	}),
	they('should fail at badFile -> badFileNew', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			copies(files);
			sandbox(sandboxDir);
			const result = await __method__(files.badFile, files.badFileNew);
			unbox();
			
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			assert(!fs.existsSync(files.badFileNew));
		});
	}),
);

// link and symlink don't allow overwriting existing files,
// copyFile follows `dest` if it's a symlink and replaces the file it refers to.
// but cp replaces `dest` itself, even if it's a symlink.
// Therefore...
describeMany(
	['cp', 'promise'],
	['cp', 'callback'],
	['cpSync', 'sync'],

	they('should succeed at overwriting an existing good-to-bad symlink', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			copies(files);
			
			// Create the "existing" good-to-bad link.
			fs.symlinkSync(files.badFile, files.goodFileNew);
			
			sandbox(sandboxDir);
			const result = await __method__(files.goodFile, files.goodFileNew);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),

	they('should succeed at overwriting an existing good-to-good symlink', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			copies(files);
			
			// Create the "existing" good-to-bad link.
			fs.symlinkSync(files.goodFile, files.goodFileNew);
			
			sandbox(sandboxDir);
			const result = await __method__(files.goodFile, files.goodFileNew);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
);

// copyFile follows `dest` if it's a symlink and replaces the file it refers to.
// Therefore...
describeMany(
	['copyFile', 'promise'],
	['copyFile', 'callback'],
	['copyFileSync', 'sync'],

	they('should fail at overwriting an existing good-to-bad symlink', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			copies(files);

			// Create the "existing" good-to-bad link.
			fs.symlinkSync(files.badFile, files.goodFileNew);
			
			sandbox(sandboxDir);
			const result = await __method__(files.goodFile, files.goodFileNew);
			unbox();
			
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
		});
	}),
	they('should succeed at overwriting an existing good-to-good symlink', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			copies(files);
			
			// Create the "existing" good-to-bad link.
			fs.symlinkSync(files.goodFile, files.goodFileNew);
			
			sandbox(sandboxDir);
			const result = await __method__(files.goodFile, files.goodFileNew);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),

	// Also use copyFile to test whether 3rd arguments get successfully passed through 2-path methods.
	they('should succeed at overwriting goodFileNew when no mode is specified', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			copies(files);
			fs.writeFileSync(files.goodFileNew, 'existing', 'utf8');

			sandbox(sandboxDir);
			const result = await __method__(files.goodFile, files.goodFileNew);
			unbox();
			
			assert.equal(result, undefined);
			assert.equal(fs.readFileSync(files.goodFileNew, 'utf8'), 'good');
		});
	}),
	they('should fail at overwriting goodFileNew when COPYFILE_EXCL mode is specified', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			copies(files);
			fs.writeFileSync(files.goodFileNew, 'existing', 'utf8');

			sandbox(sandboxDir);
			const result = await __method__(files.goodFile, files.goodFileNew, fs.constants.COPYFILE_EXCL);
			unbox();
			
			assert.equal(result && result.code, 'EEXIST');
			assert.equal(fs.readFileSync(files.goodFileNew, 'utf8'), 'existing');
		});
	}),
);
