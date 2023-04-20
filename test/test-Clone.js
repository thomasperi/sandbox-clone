/*global describe, it */
const os = require('os'); // eslint-disable-line no-unused-vars
const fs = require('fs'); // eslint-disable-line no-unused-vars
const path = require('path'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { Clone, isBoxed } = require('..'); // eslint-disable-line no-unused-vars

const tmp = os.tmpdir();
const source = path.join(__dirname, 'test-Clone');

function uniformSlashes(obj) {
	return JSON.parse(JSON.stringify(obj).replace(/\\\\/g, '/'));
}

describe('Clone tests', async () => {

	/*
	
	Use try/finally to ensure that the temp directory
	still gets deleted even if the test fails.
	
	it('should do things right', async () => {
		const clone = new Clone({source});
		try {
			// Assertions go inside the try
		} finally {
			clone.destroy();
		}
	});

	*/

	it('should create empty clone directory and destroy it', async () => {
		const clone = new Clone();
		try {
			const base = clone.base();
			const baseRel = path.relative(tmp, base);
			
			assert.equal(path.basename(baseRel), 'base');
			assert(/^clone-.{6}$/.test(path.dirname(baseRel)), 'temp base path should match pattern');
			assert(fs.existsSync(base), 'temp base should exist');
			assert(fs.statSync(base).isDirectory(), 'temp base should be a directory');
			assert(fs.readdirSync(base).length === 0, 'temp base directory should be empty');

		} finally {
			clone.destroy();
		}
	});

	it('should destroy in failing test with try...finally', async () => {
		let base;
		let error;
		
		// An outer try just for this test
		try {

			// A fake test that always throws.
			const clone = new Clone();
			base = clone.base();
			try {
				throw 'test';
			} finally {
				clone.destroy();
			}
		
		} catch (e) {
			error = e;
		}
		
		assert.equal(error, 'test');
		assert(base.startsWith(os.tmpdir() + path.sep), 'sanity check on base variable');
		assert(!fs.existsSync(base), 'destroy should delete temp directory');
	});

	it('should clone the source directory and snapshot the temp directory', async () => {
		const clone = new Clone({source});
		try {
			const base = clone.base();
			const baseRel = path.relative(tmp, base);

			assert.equal(path.basename(baseRel), 'test-Clone');
			assert(/^clone-.{6}$/.test(path.dirname(baseRel)), 'temp base path should match pattern');
		
			const snap = uniformSlashes(clone.snapshot());
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
			clone.destroy();
		}
	});

	it('should use the encodings option', async () => {
		const clone = new Clone({
			source,
			encodings: {
				'.fakeimage': 'base64'
			},
		});
		try {
			const snap = uniformSlashes(clone.snapshot());
			const zotePath = 'bar/zote.fakeimage';
			const zoteBase64 = 'em90ZQ==';
			assert.deepEqual(snap[zotePath], zoteBase64, 'fakeimage should be base64-encoded');
			
		} finally {
			clone.destroy();
		}
	});

	it('should be sandboxed during -- and only during -- `run`', async () => {
		const clone = new Clone({source});
		try {
			const base = clone.base();
			const outsideFile = path.join(base, '../bad-file.txt');
			const okContent = 'ok when unsandboxed';
			const notOkContent = 'not ok when sandboxed';

			let runBase;
			let writeFailed = false;
		
			fs.writeFileSync(outsideFile, okContent, 'utf8');

			const result = clone.run(argBase => {
				assert(isBoxed());
				runBase = argBase;
				try {
					fs.writeFileSync(outsideFile, notOkContent, 'utf8');
				} catch (e) {
					writeFailed = true;
				}
				return 'ran';
			});

			assert(!isBoxed());
			assert.equal(result, 'ran');
			
			let actualContent = fs.readFileSync(outsideFile, 'utf8');
			assert.equal(runBase, base, 'the run function should receive the same value that clone.base() returns');
			assert(writeFailed, 'sandbox should have prevented writing the outside file');
			assert.equal(actualContent, okContent, 'outside file should still have ok content');

		} finally {
			clone.destroy();
		}
	});

	it('should `run` an async function', async () => {
		const clone = new Clone({source});
		try {
			const base = clone.base();
			const outsideFile = path.join(base, '../bad-file.txt');
			const okContent = 'ok when unsandboxed';
			const notOkContent = 'not ok when sandboxed';

			let runBase;
			let writeFailed = false;
		
			fs.writeFileSync(outsideFile, okContent, 'utf8');

			const result = await clone.run(async argBase => {
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
			assert.equal(runBase, base, 'the run function should receive the same value that clone.base() returns');
			assert(writeFailed, 'sandbox should have prevented writing the outside file');
			assert.equal(actualContent, okContent, 'outside file should still have ok content');

		} finally {
			clone.destroy();
		}
	});

	it('should diff snapshots', async () => {
		const clone = new Clone({source});
		try {
			const before = uniformSlashes(clone.snapshot());
			
			clone.run(base => {
				fs.writeFileSync(path.join(base, 'bar', 'sneg.txt'), 'sneg', 'utf8');
				fs.writeFileSync(path.join(base, 'bar', 'sbor', 'thed'), 'thed 2.0', 'utf8');
				fs.rmSync(path.join(base, 'foo.txt'));
			});
			
			const after = uniformSlashes(clone.snapshot());
			const actualDiff = clone.diff(before, after);
			const expectedDiff = {
				created: [ 'bar/sneg.txt' ],
				modified: [ 'bar/sbor/thed' ],
				removed: [ 'foo.txt' ],
				unchanged: [ 'bar/zote.fakeimage' ],
			};
			assert.deepEqual(actualDiff, expectedDiff);
			
		} finally {
			clone.destroy();
		}
	});

	it('should allow relative source path', async () => {
		process.chdir(source);
		const clone = new Clone({source: 'foo/..'});
		try {
			const result = uniformSlashes(clone.snapshot());
			assert.deepEqual(result, {
				'bar/sbor/thed': 'thed',
				'bar/zote.fakeimage': 'zote',
				'foo.txt': 'foo'
			});
			
		} finally {
			clone.destroy();
		}
	});

	it('should allow empty string source path as relative', async () => {
		process.chdir(source);
		const clone = new Clone({source: ''});
		try {
			const result = uniformSlashes(clone.snapshot());
			assert.deepEqual(result, {
				'bar/sbor/thed': 'thed',
				'bar/zote.fakeimage': 'zote',
				'foo.txt': 'foo'
			});
			
		} finally {
			clone.destroy();
		}
	});

	it('should create empty directory when source path is specified as undefined', async () => {
		const clone = new Clone({source: undefined});
		try {
			const result = uniformSlashes(clone.snapshot());
			assert.deepEqual(result, {});
			
		} finally {
			clone.destroy();
		}
	});

	it('should allow base() after destroy()', async () => {
		const clone = new Clone();
		const base = clone.base();
		clone.destroy();
		assert.equal(clone.base(), base);
	});

	it('should allow destroy() after destroy()', async () => {
		const clone = new Clone();
		clone.destroy();
		clone.destroy();
	});
	
	it('should allow diff() after destroy()', async () => {
		const clone = new Clone();
		clone.destroy();
		clone.diff({}, {});
	});
	
	it('should not allow snapshot() after destroy()', async () => {
		const clone = new Clone();
		clone.destroy();
		let snapshotFailed = false;
		try {
			clone.snapshot();
		} catch (e) {
			snapshotFailed = true;
		}
		assert(snapshotFailed);
	});

	it('should not allow run() after destroy()', async () => {
		const clone = new Clone();
		clone.destroy();
		let runFailed = false;
		try {
			clone.run(() => {});
		} catch (e) {
			runFailed = true;
		}
		assert(runFailed);
	});

});

