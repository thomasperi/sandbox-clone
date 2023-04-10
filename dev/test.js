/*global describe, it */
const os = require('os');
const fs = require('fs');
const path = require('path').posix;
const sandboxFs = require('../');

const testDir = path.join(os.tmpdir(), 'test-sandbox-fs');
const boxDir = path.join(testDir, 'the-sandbox');
const disallowedFile = path.join(testDir, 'disallowed.txt');
const allowedFile = path.join(boxDir, 'allowed.txt');

// Create a temp directory, run the test, and delete the temp.
async function withTempDir(fn) {
	if (fs.existsSync(testDir)) {
		throw 'temp directory already exists';
	}
	fs.mkdirSync(boxDir, {recursive: true});
	fs.writeFileSync(allowedFile, 'yes', 'utf8');
	fs.writeFileSync(disallowedFile, 'no', 'utf8');
	try {
		await fn();
	} finally {
		fs.rmSync(testDir, {recursive: true, force: true});
	}
}

const WRONG = {};

async function bothSync(fn, args) { // async for consistency
	try {
		fn(args(disallowedFile));
		return WRONG;
	} catch (e) {
		return fn(args(allowedFile));
	}
}

async function bothPromise(fn, args) {
	try {
		await fn(args(disallowedFile));
		return WRONG;
	} catch (e) {
		return await fn(args(allowedFile));
	}
}

function bothCallback(fn, args) {
	return new Promise((resolve, reject) => {
		try {
			fn([...args(disallowedFile), ()=>{}]);
			resolve(WRONG);
		} catch (e) {
			fn([...args(allowedFile), (error, result) => {
				if (error) {
					reject(error);
				} else {
					resolve(result);
				}
			}]);
		}
	});
}

function testAllForms({setup, method, args, promises, callbacks, synchronous, assertions}) {
	const methodSync = `${method}Sync`;
	async function each(both, action) {
		return await withTempDir(async () => {
			if (setup) {
				setup();
			}
			const unbox = sandboxFs(boxDir);
			const result = await both(action, args);
			unbox();
			if (assertions) {
				assertions(result);
			}
		});
	}
	describe(`Test all '${method}' methods`, async () => {
		if (promises && fs.promises && fs.promises[method]) {
			it(`should work with fs.promises.${method}`, async () => {
				await each(bothPromise, (a) => fs.promises[method](...a));
			});
		}
		if (callbacks && fs[method]) {
			it(`should work with fs.${method}`, async () => {
				await each(bothCallback, (a) => fs[method](...a));
			});
		}
		if (synchronous && fs[methodSync]) {
			it(`should work with fs.${methodSync}`, async () => {
				await each(bothSync, (a) => fs[methodSync](...a));
			});
		}
	});
}

module.exports = {
	testAllForms,
	disallowedFile,
	allowedFile,
};