const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

const { F_OK, R_OK, W_OK, X_OK } = fs.constants;

function chmod_u_rwx(files) {
	fs.chmodSync(files.goodFile, 0o700);
	fs.chmodSync(files.badFile, 0o700);
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
			sandbox();
			const result = await __method__(files.badFile, W_OK);
			unbox();
			process.chdir(realCwd);
			
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
		});
	}),
);
