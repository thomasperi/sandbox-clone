/*global describe, it */
const os = require('os');
const fs = require('fs');
const assert = require('assert');
const path = require('path').posix;
const sandboxFs = require('../');

const testDir = path.join(os.tmpdir(), 'test-sandbox-fs');
const boxDir = path.join(testDir, 'the-sandbox');
const disallowedFile = path.join(testDir, 'disallowed.txt');
const allowedFile = path.join(boxDir, 'allowed.txt');

const FAIL = ['FAIL'];

async function boxed(fn) {
	const unbox = sandboxFs(boxDir);
	let result = await fn();
	unbox();
	return result;
}

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

async function tryOneWay(attempts, fsMethodProxy) {
	for (const attempt of attempts) {
		await withTempDir(() => attempt(fsMethodProxy));
	}
}


function testAllForms({method, attempts}) {
	const methodSync = `${method}Sync`;

	describe(`Test all '${method}' methods`, async () => {
		it(`should change the methods if they exist`, async () => {
			const grab = async () => ({
				promise: fs.promises[method],
				callback: fs[method],
				synchronous: fs[methodSync],
			});
			const original = await grab();
			const monkeyed = await boxed(grab);
			const unmonkeyed = await grab();
			for (const way of ['promise', 'callback', 'synchronous']) {
				if (typeof unmonkeyed[way] === 'function') {
					assert.notEqual(monkeyed[way], unmonkeyed[way], `${way} method should be different after monkeying`);
					assert.equal(original[way], unmonkeyed[way], `${way} method should be restored after unmonkeying`);
				}
			}
		});
		
		if (fs.promises && fs.promises[method]) {
			it(`should work with fs.promises.${method}`, async () => {
				await tryOneWay(attempts, async (...a) => {
					try {
						return await fs.promises[method](...a);
					} catch (e) {
						return FAIL;
					}
				});
			});
		}
		
		if (fs[method]) {
			it(`should work with fs.${method}`, async () => {
				await tryOneWay(attempts, (...a) => new Promise((resolve) => {
					try {
						fs[method](...a, (error, result) => {
							resolve(error ? FAIL : result);
						});
					} catch (e) {
						resolve(FAIL);
					}
				}));
			});
		}
		
		if (fs[methodSync]) {
			it(`should work with fs.${methodSync}`, async () => {
				await tryOneWay(attempts, async (...a) => {
					try {
						return fs[methodSync](...a);
					} catch (e) {
						return FAIL;
					}
				});
			});
		}
		
	});
}

module.exports = {
	FAIL,
	boxed,
	testAllForms,
	disallowedFile,
	allowedFile,
};