const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

const { F_OK, R_OK, W_OK, X_OK } = fs.constants;

function chmod_u_rwx(files) {
	fs.chmodSync(files.goodFile, 0o700);
	fs.chmodSync(files.badFile, 0o700);
}

function code(obj) {
	return obj && obj.code;
}

describeMany(
	['access', 'promise'],
	['access', 'callback'],
	['accessSync', 'sync'],
	they('should succeed at accessing good file with no mode specified', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			chmod_u_rwx(files);
			
			sandbox(sandboxDir);
			const result = await __method__(files.goodFile);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should succeed at accessing bad file with no mode specified', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			chmod_u_rwx(files);
			
			sandbox(sandboxDir);
			const result = await __method__(files.badFile);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should succeed at accessing good file for visibility', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			fs.chmodSync(files.goodFile, 0);
			fs.chmodSync(files.badFile, 0);
			
			sandbox(sandboxDir);
			const result = await __method__(files.goodFile, F_OK);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should succeed at accessing bad file for visibility', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			fs.chmodSync(files.goodFile, 0);
			fs.chmodSync(files.badFile, 0);
			
			sandbox(sandboxDir);
			const result = await __method__(files.badFile, F_OK);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should succeed at accessing good file for read', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			chmod_u_rwx(files);
			
			sandbox(sandboxDir);
			const result = await __method__(files.goodFile, R_OK);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should succeed at accessing bad file for read', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			chmod_u_rwx(files);
			
			sandbox(sandboxDir);
			const result = await __method__(files.badFile, R_OK);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should succeed at accessing good file for write', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			chmod_u_rwx(files);
			
			sandbox(sandboxDir);
			const result = await __method__(files.goodFile, W_OK);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should fail at accessing bad file for write', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			chmod_u_rwx(files);
			
			sandbox(sandboxDir);
			const result = await __method__(files.badFile, W_OK);
			unbox();
			
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
		});
	}),
	they('should succeed at accessing good file for execute', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			chmod_u_rwx(files);
	
			sandbox(sandboxDir);
			const result = await __method__(files.goodFile, X_OK);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should succeed at accessing bad file for execute', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			chmod_u_rwx(files);
			
			sandbox(sandboxDir);
			const result = await __method__(files.badFile, X_OK);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	
	they('should succeed at accessing a good link to a good file for write', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			chmod_u_rwx(files);
			
			sandbox(sandboxDir);
			const result = await __method__(files.goodToGood, W_OK);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should succeed at accessing a bad link to a good file for write', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			chmod_u_rwx(files);
			
			sandbox(sandboxDir);
			const result = await __method__(files.badToGood, W_OK);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should fail at accessing a good link to a bad file for write', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			chmod_u_rwx(files);
			
			sandbox(sandboxDir);
			const result = await __method__(files.goodToBad, W_OK);
			unbox();
			
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
		});
	}),
	they('should fail at accessing a bad link to a bad file for write', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			chmod_u_rwx(files);
			
			sandbox(sandboxDir);
			const result = await __method__(files.badToBad, W_OK);
			unbox();
			
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
		});
	}),

	they('should work with relative sandbox path', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			chmod_u_rwx(files);
			
			const realCwd = process.cwd();
			process.chdir(sandboxDir);

			sandbox('foo/..');
			const resultGood = await __method__(files.goodFile, W_OK);
			const resultBad = await __method__(files.badFile, W_OK);
			unbox();

			process.chdir(realCwd);

			assert.equal(resultGood, undefined);
			assert.equal(resultBad && resultBad.code, 'OUTSIDE_SANDBOX');
			
		});
	}),

	they('should work with relative argument paths', async (__method__) => {
		await withTempFiles(async (sandboxDir, files) => {
			chmod_u_rwx(files);
			
			const path = require('path');
			const badSubdir = path.join(path.dirname(files.badFile), 'bad-subdir');
			const goodSubdir = path.join(path.dirname(files.goodFile), 'good-subdir');

			const tempDir = path.dirname(sandboxDir);
			
			const goodFromSandbox = path.relative(sandboxDir, goodSubdir);
			const goodFromTemp = path.relative(tempDir, goodSubdir);
			const goodFromBad = path.relative(badSubdir, goodSubdir);

			const badFromSandbox = path.relative(sandboxDir, badSubdir);
			const badFromTemp = path.relative(tempDir, badSubdir);
			const badFromGood = path.relative(goodSubdir, badSubdir);
			
			const tempFromSandbox = path.relative(sandboxDir, tempDir);
			const tempFromGood = path.relative(goodSubdir, tempDir);
			const tempFromBad = path.relative(badSubdir, tempDir);

			const sandboxFromGood = path.relative(goodSubdir, sandboxDir);
			const sandboxFromBad = path.relative(badSubdir, sandboxDir);
			const sandboxFromTemp = path.relative(tempDir, sandboxDir);
			
			fs.mkdirSync(badSubdir);
			fs.mkdirSync(goodSubdir);
			
			const realCwd = process.cwd();
			
			sandbox(sandboxDir);
			
			process.chdir(goodSubdir);
			const emptyFromGoodResult = await __method__('', W_OK);
			const dotFromGoodResult = await __method__('.', W_OK);
			const badFromGoodResult = await __method__(badFromGood, W_OK);
			const tempFromGoodResult = await __method__(tempFromGood, W_OK);
			const sandboxFromGoodResult = await __method__(sandboxFromGood, W_OK);

			process.chdir(badSubdir);
			const goodFromBadResult = await __method__(goodFromBad, W_OK);
			const emptyFromBadResult = await __method__('', W_OK); 
			const dotFromBadResult = await __method__('.', W_OK);
			const tempFromBadResult = await __method__(tempFromBad, W_OK);
			const sandboxFromBadResult = await __method__(sandboxFromBad, W_OK);

			process.chdir(tempDir);
			const goodFromTempResult = await __method__(goodFromTemp, W_OK);
			const badFromTempResult = await __method__(badFromTemp, W_OK);
			const emptyFromTempResult = await __method__('', W_OK);
			const dotFromTempResult = await __method__('.', W_OK);
			const sandboxFromTempResult = await __method__(sandboxFromTemp, W_OK);

			process.chdir(sandboxDir);
			const goodFromSandboxResult = await __method__(goodFromSandbox, W_OK);
			const badFromSandboxResult = await __method__(badFromSandbox, W_OK);
			const tempFromSandboxResult = await __method__(tempFromSandbox, W_OK);
			const emptyFromSandboxResult = await __method__('', W_OK);
			const dotFromSandboxResult = await __method__('.', W_OK);
			
			unbox();

			process.chdir(realCwd);
			
			assert.equal(goodFromBadResult, undefined);
			assert.equal(goodFromTempResult, undefined);
			assert.equal(goodFromSandboxResult, undefined);
			assert.equal(dotFromGoodResult, undefined);
			assert.equal(code(emptyFromGoodResult), 'ENOENT');
				// `access` doesn't know what to do with an empty string, but the sandbox accepts it

			assert.equal(code(badFromGoodResult), 'OUTSIDE_SANDBOX');
			assert.equal(code(badFromTempResult), 'OUTSIDE_SANDBOX');
			assert.equal(code(badFromSandboxResult), 'OUTSIDE_SANDBOX');
			assert.equal(code(dotFromBadResult), 'OUTSIDE_SANDBOX');
			assert.equal(code(emptyFromBadResult), 'OUTSIDE_SANDBOX');

			assert.equal(code(tempFromGoodResult), 'OUTSIDE_SANDBOX');
			assert.equal(code(tempFromBadResult), 'OUTSIDE_SANDBOX');
			assert.equal(code(tempFromSandboxResult), 'OUTSIDE_SANDBOX');
			assert.equal(code(dotFromTempResult), 'OUTSIDE_SANDBOX');
			assert.equal(code(emptyFromTempResult), 'OUTSIDE_SANDBOX');

			assert.equal(code(sandboxFromGoodResult), 'IS_SANDBOX');
			assert.equal(code(sandboxFromBadResult), 'IS_SANDBOX');
			assert.equal(code(sandboxFromTempResult), 'IS_SANDBOX');
			assert.equal(code(dotFromSandboxResult), 'IS_SANDBOX');
			assert.equal(code(emptyFromSandboxResult), 'IS_SANDBOX');
			
		});
	}),

);
