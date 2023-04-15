const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles, sandboxDir, files } = require('../dev/test.js'); // eslint-disable-line no-unused-vars
const { goodFile, badFile, goodToGood, badToGood, goodToBad, badToBad } = files; // eslint-disable-line no-unused-vars

const { F_OK, R_OK, W_OK, X_OK } = fs.constants;

function chmod_u_rwx() {
	fs.chmodSync(goodFile, 0o700);
	fs.chmodSync(badFile, 0o700);
}

describeMany(
	['access', 'promise'],
	['access', 'callback'],
	['accessSync', 'sync'],
	they('should succeed at accessing good file with no mode specified', async (__method__) => {
		await withTempFiles(async () => {
			chmod_u_rwx();
			
			sandbox(sandboxDir);
			const result = await __method__(goodFile);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should succeed at accessing bad file with no mode specified', async (__method__) => {
		await withTempFiles(async () => {
			chmod_u_rwx();
			
			sandbox(sandboxDir);
			const result = await __method__(badFile);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should succeed at accessing good file for visibility', async (__method__) => {
		await withTempFiles(async () => {
			fs.chmodSync(goodFile, 0);
			fs.chmodSync(badFile, 0);
			
			sandbox(sandboxDir);
			const result = await __method__(goodFile, F_OK);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should succeed at accessing bad file for visibility', async (__method__) => {
		await withTempFiles(async () => {
			fs.chmodSync(goodFile, 0);
			fs.chmodSync(badFile, 0);
			
			sandbox(sandboxDir);
			const result = await __method__(badFile, F_OK);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should succeed at accessing good file for read', async (__method__) => {
		await withTempFiles(async () => {
			chmod_u_rwx();
			
			sandbox(sandboxDir);
			const result = await __method__(goodFile, R_OK);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should succeed at accessing bad file for read', async (__method__) => {
		await withTempFiles(async () => {
			chmod_u_rwx();
			
			sandbox(sandboxDir);
			const result = await __method__(badFile, R_OK);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should succeed at accessing good file for write', async (__method__) => {
		await withTempFiles(async () => {
			chmod_u_rwx();
			
			sandbox(sandboxDir);
			const result = await __method__(goodFile, W_OK);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should fail at accessing bad file for write', async (__method__) => {
		await withTempFiles(async () => {
			chmod_u_rwx();
			
			sandbox(sandboxDir);
			const result = await __method__(badFile, W_OK);
			unbox();
			
			assert.equal(result.code, 'OUTSIDE_SANDBOX');
		});
	}),
	they('should succeed at accessing good file for execute', async (__method__) => {
		await withTempFiles(async () => {
			chmod_u_rwx();

			sandbox(sandboxDir);
			const result = await __method__(goodFile, X_OK);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should succeed at accessing bad file for execute', async (__method__) => {
		await withTempFiles(async () => {
			chmod_u_rwx();
			
			sandbox(sandboxDir);
			const result = await __method__(badFile, X_OK);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),

	they('should succeed at accessing a good link to a good file for write', async (__method__) => {
		await withTempFiles(async () => {
			chmod_u_rwx();
			
			sandbox(sandboxDir);
			const result = await __method__(goodToGood, W_OK);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should succeed at accessing a bad link to a good file for write', async (__method__) => {
		await withTempFiles(async () => {
			chmod_u_rwx();
			
			sandbox(sandboxDir);
			const result = await __method__(badToGood, W_OK);
			unbox();
			
			assert.equal(result, undefined);
		});
	}),
	they('should fail at accessing a good link to a bad file for write', async (__method__) => {
		await withTempFiles(async () => {
			chmod_u_rwx();
			
			sandbox(sandboxDir);
			const result = await __method__(goodToBad, W_OK);
			unbox();
			
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
		});
	}),
	they('should fail at accessing a bad link to a bad file for write', async (__method__) => {
		await withTempFiles(async () => {
			chmod_u_rwx();
			
			sandbox(sandboxDir);
			const result = await __method__(badToBad, W_OK);
			unbox();
			
			assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
		});
	}),
);
