/*global describe, it */
const os = require('os');
const fs = require('fs');
const path = require('path').posix;
const assert = require('assert');
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
	async function each(way, action) {
		return await withTempDir(async () => {
			if (setup) {
				setup();
			}
			const unbox = sandboxFs(boxDir);
			await way(action, args);
			unbox();
			assertions();
		});
	}
	describe(`Test all forms of ${method} methods`, async () => {
		if (promises) {
			it(`should work with fs.promises.${method}`, async () => {
				await each(bothPromise, (a) => fs.promises[method](...a));
			});
		}
		if (callbacks) {
			it(`should work with fs.${method}`, async () => {
				await each(bothCallback, (a) => fs[method](...a));
			});
		}
		if (synchronous) {
			it(`should work with fs.${method}Sync`, async () => {
				await each(bothSync, (a) => fs[`${method}Sync`](...a));
			});
		}
	});
}

testAllForms({
	method: 'appendFile',
	args: file => [file, ' zote', 'utf8'],
	promises: true,
	callbacks: true,
	synchronous: true,
	assertions: () => {
		const actualNo = fs.readFileSync(disallowedFile, 'utf8');
		const actualYes = fs.readFileSync(allowedFile, 'utf8');
		assert.equal(actualNo, 'no');
		assert.equal(actualYes, 'yes zote');
	},
});

testAllForms({
	setup: () => {
		// make both read-only initially
		fs.chmodSync(disallowedFile, 0o400);
		fs.chmodSync(allowedFile, 0o400);
	},
	method: 'chmod',
	args: file => [file, 0o200], // only the allowed one should change to write-only
	promises: true,
	callbacks: true,
	synchronous: true,
	assertions: () => {
		// allowed should be writable now, having been chmod'd to write-only
		fs.accessSync(allowedFile, fs.constants.W_OK);

		// disallowed should still be readable, NOT having been chmod'd to write-only
		fs.accessSync(disallowedFile, fs.constants.R_OK);
	},
});

