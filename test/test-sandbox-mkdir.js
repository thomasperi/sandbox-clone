const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox } = require('..'); // eslint-disable-line no-unused-vars
const { describeMany, they, withTempFiles, sandboxDir, goodFile, badFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

const path = require('path');
const badSubdir = path.join(path.dirname(badFile), 'bad-subdir');
const goodSubdir = path.join(path.dirname(goodFile), 'good-subdir');

describeMany(
	['mkdir', 'promise'],
	['mkdir', 'callback'],
	['mkdirSync', 'sync'],
	they('should succeed at creating a good directory', async (__method__) => {
		await withTempFiles(async () => {
			sandbox(sandboxDir);
			const result = await __method__(goodSubdir);
			unbox();
			assert.equal(result, undefined);
			assert(fs.existsSync(goodSubdir));
			assert(fs.statSync(goodSubdir).isDirectory());
		});
	}),
	they('should fail at creating a bad directory', async (__method__) => {
		await withTempFiles(async () => {
			sandbox(sandboxDir);
			const result = await __method__(badSubdir);
			unbox();
			assert.equal(result.code, 'OUTSIDE_SANDBOX');
			assert(!fs.existsSync(badSubdir));
		});
	}),
);
