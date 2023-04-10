/*global describe, it */
const os = require('os');
const fs = require('fs');
const assert = require('assert');
const path = require('path').posix;
const sandboxFs = require('../');

const testDir = path.join(os.tmpdir(), 'test-sandbox-fs');
const boxDir = path.join(testDir, 'the-sandbox');
const disallowedFile = path.join(testDir, 'disallowed');
const allowedFile = path.join(boxDir, 'allowed');

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

async function tryMethod(attempts, fsMethodProxy) {
	for (const attempt of attempts) {
		await withTempDir(() => attempt(fsMethodProxy));
	}
}

async function tryMonkey(label, getMethod) {
	const original = await getMethod();
	const monkeyed = await boxed(getMethod);
	const unmonkeyed = await getMethod();
	assert.notEqual(monkeyed, unmonkeyed, `${label} should be different after monkeying`);
	assert.equal(original, unmonkeyed, `${label} should be restored after unmonkeying`);
}

function itPromise(method, label, attempts) {
	if (typeof fs.promises[method] === 'function') {
		it(`should sandbox ${label}`, async () => {
			await tryMonkey(label, async () => fs.promises[method]);
			await tryMethod(attempts, async (...a) => {
				try {
					return await fs.promises[method](...a);
				} catch (e) {
					return FAIL;
				}
			});
		});
	}
}

function itCallback(method, label, attempts) {
	if (typeof fs[method] === 'function') {
		it(`should sandbox ${label}`, async () => {
			await tryMonkey(label, async () => fs[method]);
			await tryMethod(attempts, (...a) => new Promise((resolve) => {
				try {
					fs[method](...a, (error, result) => {
						// Accommodate the weird callback for fs.exists
						if (label === 'fs.exists') {
							result = error;
							error = false;
						}
						resolve(error ? FAIL : result);
					});
				} catch (e) {
					resolve(FAIL);
				}
			}));
		});
	}
}

function itSync(method, label, attempts) {
	if (typeof fs[method] === 'function') {
		it(`should sandbox ${label}`, async () => {
			await tryMonkey(label, async () => fs[method]);
			await tryMethod(attempts, async (...a) => {
				try {
					return fs[method](...a);
				} catch (e) {
					return FAIL;
				}
			});
		});
	}
}

// Wrap promise methods, callback methods, and sync methods in consistent async proxy
// methods so that they can all be tested the same way.
function testFeature({methods, attempts}) {
	const labels = methods.map((item) => {
		const [method, kind] = item;
		const label = kind === 'promise' ? `fs.promises.${method}` : `fs.${method}`;
		item.push(label);
		return label;
	}).join(', ');
	describe(`Test ${labels}`, async () => {
		for (const [method, kind, label] of methods) {
			switch (kind) {
				case 'promise': {
					itPromise(method, label, attempts);
					break;
				}
				case 'callback': {
					itCallback(method, label, attempts);
					break;
				}
				case 'sync': {
					itSync(method, label, attempts);
					break;
				}
			}
		}
	});
}

module.exports = {
	FAIL,
	boxed,
	testFeature,
	disallowedFile,
	allowedFile,
};