const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles, isWindows } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

const writeFlags = ['a', 'a+', 'as', 'as+', 'r+', 'rs+', 'w', 'w+'];
const writeFlagsNoExist = ['ax', 'ax+', 'wx', 'wx+'];

const FileHandle = fs.promises.open(__filename).then(fh => {
	fh.close();
	return fh.constructor;
});

async function assertResultType(result, type, msg) {
	switch (type) {
		case 'promise':
			assert(result instanceof (await FileHandle), msg);
			break;
		case 'callback':
		case 'sync':
			assert.equal(typeof result, 'number', msg);
			break;
		default:
			assert.fail('invalid test method type somehow');
	}
}

async function closeResult(result) {
	if (typeof result === 'number') {
		fs.closeSync(result);
	} else if (result instanceof (await FileHandle)) {
		result.close();
	}
}

describeMany(
	['open', 'promise'],
	['open', 'callback'],
	['openSync', 'sync'],
	
	// to-do: test with symlinks

	they('should succeed at opening a good file for reading with no flag', async (__method__, type) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.goodFile);
			unbox();
			
			await assertResultType(result, type);
			await closeResult(result);
		});
	}),
	they('should succeed at opening a good file for reading with `r` flag', async (__method__, type) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.goodFile, 'r');
			unbox();
			
			await assertResultType(result, type);
			await closeResult(result);
		});
	}),
	they('should succeed at opening a bad file for reading with no flag', async (__method__, type) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.goodFile);
			unbox();
			
			await assertResultType(result, type);
			await closeResult(result);
		});
	}),
	they('should succeed at opening a bad file for reading with `r` flag', async (__method__, type) => {
		await withTempFiles(async (sandboxDir, files) => {
			sandbox(sandboxDir);
			const result = await __method__(files.goodFile, 'r');
			unbox();
			
			await assertResultType(result, type);
			await closeResult(result);
		});
	}),
	they('should succeed at opening a good file for writing', async (__method__, type) => {
		for (const flag of writeFlags) {
			await withTempFiles(async (sandboxDir, files) => {
				sandbox(sandboxDir);
				const result = await __method__(files.goodFile, flag);
				unbox();
			
				await assertResultType(result, type, `problem with ${flag}`);
				await closeResult(result);
			});
		}
		for (const flag of writeFlagsNoExist) {
			await withTempFiles(async (sandboxDir, files) => {
				sandbox(sandboxDir);
				const result = await __method__(`${files.goodFile}-no-exist`, flag);
				unbox();
			
				await assertResultType(result, type, `problem with ${flag}`);
				await closeResult(result);
			});
		}
	}),
	they('should fail at opening a bad file for writing', async (__method__) => {
		for (const flag of writeFlags) {
			await withTempFiles(async (sandboxDir, files) => {
				sandbox(sandboxDir);
				const result = await __method__(files.badFile, flag);

				await closeResult(result);
				assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
				unbox();
			});
		}
		for (const flag of writeFlagsNoExist) {
			await withTempFiles(async (sandboxDir, files) => {
				sandbox(sandboxDir);
				const result = await __method__(`${files.badFile}-no-exist`, flag);

				await closeResult(result);
				assert.equal(result && result.code, 'OUTSIDE_SANDBOX');
				unbox();
			});
		}
	}),
);
