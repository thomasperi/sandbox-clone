const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

const path = require('path');
function subdirs(files) {
	files.badSubdir = path.join(path.dirname(files.badFile), 'bad-subdir');
	files.goodSubdir = path.join(path.dirname(files.goodFile), 'good-subdir');
}

describeMany(
	['mkdir', 'promise'],
	['mkdir', 'callback'],
	['mkdirSync', 'sync'],
	
	// to-do:
	// Test the scenario of attempting mkdir on a symlink
	// that points to a non-existant directory outside the sandbox.
	// Should fail because mkdir dereferences the path.
	
	they('should succeed at creating a good directory', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			subdirs(files);
			sandbox(sandboxDir);
			const result = await __method__(files.goodSubdir);
			unbox();
			assert.equal(result, undefined);
			assert(fs.existsSync(files.goodSubdir));
			assert(fs.statSync(files.goodSubdir).isDirectory());
		});
	}),
	they('should fail at creating a bad directory', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			subdirs(files);
			sandbox(sandboxDir);
			const result = await __method__(files.badSubdir);
			unbox();
			assert.equal(result.code, 'OUTSIDE_SANDBOX');
			assert(!fs.existsSync(files.badSubdir));
		});
	}),
);
