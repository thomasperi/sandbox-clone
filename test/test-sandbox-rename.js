const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

function newNames(files) {
	files.goodNew = files.goodFile + '-renamed';
	files.badNew = files.badFile + '-renamed';
}

describeMany(
	['rename', 'promise'],
	['rename', 'callback'],
	['renameSync', 'sync'],

	they('should succeed at renaming good to good', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			newNames(files);
			const oldPath = files.goodFile;
			const newPath = files.goodNew;
			const content = fs.readFileSync(oldPath, 'utf8');
			
			sandbox(sandboxDir);
			const result = await __method__(oldPath, newPath);
			unbox();
			
			assert.equal(result, undefined);
			assert(!fs.existsSync(oldPath));
			assert.equal(fs.readFileSync(newPath, 'utf8'), content);
		});
	}),

	they('should fail at renaming good to bad', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			newNames(files);
			const oldPath = files.goodFile;
			const newPath = files.badNew;
			const content = fs.readFileSync(oldPath, 'utf8');
			
			sandbox(sandboxDir);
			const result = await __method__(oldPath, newPath);
			unbox();
			
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			assert.equal(fs.readFileSync(oldPath, 'utf8'), content);
			assert(!fs.existsSync(newPath));
		});
	}),

	they('should fail at renaming bad to good', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			newNames(files);
			const oldPath = files.badFile;
			const newPath = files.goodNew;
			const content = fs.readFileSync(oldPath, 'utf8');
			
			sandbox(sandboxDir);
			const result = await __method__(oldPath, newPath);
			unbox();
			
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			assert.equal(fs.readFileSync(oldPath, 'utf8'), content);
			assert(!fs.existsSync(newPath));
		});
	}),

	they('should fail at renaming bad to bad', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			newNames(files);
			const oldPath = files.badFile;
			const newPath = files.badNew;
			const content = fs.readFileSync(oldPath, 'utf8');
			
			sandbox(sandboxDir);
			const result = await __method__(oldPath, newPath);
			unbox();
			
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
			assert.equal(fs.readFileSync(oldPath, 'utf8'), content);
			assert(!fs.existsSync(newPath));
		});
	}),

	they('should succeed at overwriting an existing good-to-bad symlink', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			newNames(files);
			const oldPath = files.goodFile;
			const newPath = files.goodNew;
			
			// Create the "existing" good-to-bad link.
			fs.symlinkSync(files.badFile, newPath);
			
			sandbox(sandboxDir);
			const result = await __method__(oldPath, newPath);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),

);
