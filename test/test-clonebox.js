/*global describe, it */
const os = require('os'); // eslint-disable-line no-unused-vars
const fs = require('fs'); // eslint-disable-line no-unused-vars
const path = require('path'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { clonebox } = require('..'); // eslint-disable-line no-unused-vars

const tmp = os.tmpdir();
const source = path.join(__dirname, 'test-clonebox');

describe('clonebox tests', async () => {

	/*
	
	Use try/finally to ensure that the temp directory
	still gets deleted even if the test fails.
	
	it('should do things right', async () => {
		const box = clonebox({source});
		try {
			// Assertions go inside the try
		} finally {
			box.destroy();
		}
	});

	*/

	it('should create empty clone directory and destroy it', async () => {
		const box = clonebox();
		try {
			const base = box.base();
			const baseRel = path.relative(tmp, base);
			assert(/clonebox-.{6}\/base/.test(baseRel), 'temp base path should match pattern');
			assert(fs.existsSync(base), 'temp base should exist');
			assert(fs.statSync(base).isDirectory(), 'temp base should be a directory');
			assert(fs.readdirSync(base).length === 0, 'temp base directory should be empty');

		} finally {
			box.destroy();
		}
		assert(!fs.existsSync(box.base()), 'temp base should not exist after destroy');
	});

	it('should work best with try...finally', async () => {
		let error;
		let base;
		
		// An outer try just for this test
		try {

			// A fake test that always throws.
			const box = clonebox();
			base = box.base();
			try {
				throw 'test';
			} finally {
				box.destroy();
			}
		
		} catch (e) {
			error = e;
		}
		
		assert.equal(error, 'test');
		assert(base.startsWith(os.tmpdir() + path.sep), 'sanity check on base variable');
		assert(!fs.existsSync(base), 'destroy in finally should always run');
	});

	it('should clone the source directory and snapshot the temp directory', async () => {
		const box = clonebox({source});
		try {
			const base = box.base();
			const baseRel = path.relative(tmp, base);
			assert(/clonebox-.{6}\/test-clonebox/.test(baseRel), 'temp base path should match pattern');
		
			const snap = box.snapshot();
			const expectedSnap = {
				'bar/sbor/thed': 'thed',
				'bar/zote.fakeimage': 'zote',
				'foo.txt': 'foo'
			};
			assert.deepEqual(snap, expectedSnap, 'snap should report copied files');
		
			const foo = fs.readFileSync(path.join(base, 'foo.txt'));
			const zote = fs.readFileSync(path.join(base, 'bar/zote.fakeimage'));
			const thed = fs.readFileSync(path.join(base, 'bar/sbor/thed'));
		
			assert.equal(foo, 'foo', 'foo copy should have same content as original');
			assert.equal(zote, 'zote', 'zote copy should have same content as original');
			assert.equal(thed, 'thed', 'thed copy should have same content as original');
		
		} finally {
			box.destroy();
		}
	});

	it('should use the encodings option', async () => {
		const box = clonebox({
			source,
			encodings: {
				'.fakeimage': 'base64'
			},
		});
		try {
			const snap = box.snapshot();
			const zotePath = 'bar/zote.fakeimage';
			const zoteBase64 = 'em90ZQ==';
			assert.deepEqual(snap[zotePath], zoteBase64, 'fakeimage should be base64-encoded');
			
		} finally {
			box.destroy();
		}
	});

	it('should `run` in sandboxed mode', async () => {
		const box = clonebox({source});
		try {
			const base = box.base();
			const outsideFile = path.join(base, '../bad-file.txt');
			const okContent = 'ok when unsandboxed';
			const notOkContent = 'not ok when sandboxed';

			let runBase;
			let writeFailed = false;
		
			fs.writeFileSync(outsideFile, okContent, 'utf8');

			const result = box.run(argBase => {
				runBase = argBase;
				try {
					fs.writeFileSync(outsideFile, notOkContent, 'utf8');
				} catch (e) {
					writeFailed = true;
				}
				return 'ran';
			});
			
			assert.equal(result, 'ran');
			
			let actualContent = fs.readFileSync(outsideFile, 'utf8');
			assert.equal(runBase, base, 'the run function should receive the same value that box.base() returns');
			assert(writeFailed, 'sandbox should have prevented writing the outside file');
			assert.equal(actualContent, okContent, 'outside file should still have ok content');

		} finally {
			box.destroy();
		}
	});

	it('should `run` an async function', async () => {
		const box = clonebox({source});
		try {
			const base = box.base();
			const outsideFile = path.join(base, '../bad-file.txt');
			const okContent = 'ok when unsandboxed';
			const notOkContent = 'not ok when sandboxed';

			let runBase;
			let writeFailed = false;
		
			fs.writeFileSync(outsideFile, okContent, 'utf8');

			const result = await box.run(async argBase => {
				runBase = argBase;
				try {
					await fs.promises.writeFile(outsideFile, notOkContent, 'utf8');
				} catch (e) {
					writeFailed = true;
				}
				return 'ran async! amazing!';
			});

			assert.equal(result, 'ran async! amazing!');
			
			let actualContent = fs.readFileSync(outsideFile, 'utf8');
			assert.equal(runBase, base, 'the run function should receive the same value that box.base() returns');
			assert(writeFailed, 'sandbox should have prevented writing the outside file');
			assert.equal(actualContent, okContent, 'outside file should still have ok content');

		} finally {
			box.destroy();
		}
	});

	it('should diff snapshots', async () => {
		const box = clonebox({source});
		try {
			const before = box.snapshot();
			
			box.run(base => {
				fs.writeFileSync(path.join(base, 'bar/sneg.txt'), 'sneg', 'utf8');
				fs.writeFileSync(path.join(base, 'bar/sbor/thed'), 'thed 2.0', 'utf8');
				fs.rmSync(path.join(base, 'foo.txt'));
			});
			
			const after = box.snapshot();
			const actualDiff = box.diff(before, after);
			const expectedDiff = {
				created: [ 'bar/sneg.txt' ],
				modified: [ 'bar/sbor/thed' ],
				removed: [ 'foo.txt' ],
			};
			assert.deepEqual(actualDiff, expectedDiff);
			
		} finally {
			box.destroy();
		}
	});

	it('should allow base() after destroy()', async () => {
		const box = clonebox();
		const base = box.base();
		box.destroy();
		assert.equal(box.base(), base);
	});

	it('should allow destroy() after destroy()', async () => {
		const box = clonebox();
		box.destroy();
		box.destroy();
	});
	
	it('should allow diff() after destroy()', async () => {
		const box = clonebox();
		box.destroy();
		box.diff({}, {});
	});
	
	it('should not allow snapshot() after destroy()', async () => {
		const box = clonebox();
		box.destroy();
		let snapshotFailed = false;
		try {
			box.snapshot();
		} catch (e) {
			snapshotFailed = true;
		}
		assert(snapshotFailed);
	});

	it('should not allow run() after destroy()', async () => {
		const box = clonebox();
		box.destroy();
		let runFailed = false;
		try {
			box.run(() => {});
		} catch (e) {
			runFailed = true;
		}
		assert(runFailed);
	});

});

