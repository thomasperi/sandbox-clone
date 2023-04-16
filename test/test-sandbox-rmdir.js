const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

const path = require('path');
function subdirs(files) {
	files.badSubdir = path.join(path.dirname(files.badFile), 'bad-subdir');
	files.goodSubdir = path.join(path.dirname(files.goodFile), 'good-subdir');
	fs.mkdirSync(files.badSubdir);
	fs.mkdirSync(files.goodSubdir);
}

describeMany(
	['rmdir', 'promise'],
	['rmdir', 'callback'],
	['rmdirSync', 'sync'],
	
	// to-do: test with symlink
	
	they('should succeed at removing a good directory', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			subdirs(files);
			sandbox(sandboxDir);
			const result = await __method__(files.goodSubdir);
			unbox();
			assert.equal(result, undefined);
			assert(!fs.existsSync(files.goodSubdir));
		});
	}),
	they('should fail at removing a bad directory', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			subdirs(files);
			sandbox(sandboxDir);
			const result = await __method__(files.badSubdir);
			unbox();
			assert.equal(result.code, 'OUTSIDE_SANDBOX');
			assert(fs.existsSync(files.badSubdir));
		});
	}),

	they('should fail at removing the sandbox directory itself', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			subdirs(files);
			sandbox(sandboxDir);
			const result = await __method__(sandboxDir);
			unbox();
			assert.equal(result.code, 'IS_SANDBOX');
			assert(fs.existsSync(sandboxDir));
		});
	}),
	they('should fail at removing a the sandbox parent directory', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			subdirs(files);
			sandbox(sandboxDir);
			const parent = path.dirname(sandboxDir);
			const result = await __method__(parent);
			unbox();
			assert.equal(result.code, 'OUTSIDE_SANDBOX');
			assert(fs.existsSync(parent));
		});
	}),
);
