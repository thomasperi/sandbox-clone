/*global describe, it */
const os = require('os');
const fs = require('fs');
const path = require('path').posix;

const tmp = os.tmpdir();

async function withTempFiles(fn) {
	const prefix = path.join(tmp, 'test-sandbox-');
	const testDir = fs.mkdtempSync(prefix);
	const sandboxDir = path.join(testDir, 'the-sandbox');
	const good = path.join(sandboxDir, 'good');
	const bad = path.join(testDir, 'bad');
	const files = {
		goodFile: `${good}-file`,
		badFile: `${bad}-file`,
		goodToGood: `${good}-link-to-good-file`,
		badToGood: `${bad}-link-to-good-file`,
		goodToBad: `${good}-link-to-bad-file`,
		badToBad: `${bad}-link-to-bad-file`,
	};
	// if (fs.existsSync(testDir)) {
	// 	throw `${testDir} already exists, delete manually`;
	// }
	try {
		fs.mkdirSync(sandboxDir, {recursive: true});
		
		fs.writeFileSync(files.goodFile, 'good', 'utf8');
		fs.writeFileSync(files.badFile, 'bad', 'utf8');

		fs.symlinkSync(files.goodFile, files.goodToGood);
		fs.symlinkSync(files.goodFile, files.badToGood);
		fs.symlinkSync(files.badFile, files.goodToBad);
		fs.symlinkSync(files.badFile, files.badToBad);

		await fn(sandboxDir, files);
	} finally {
		fs.rmSync(testDir, {recursive: true, force: true});
	}
}

function they(itLabel, itFn) {
	return {itLabel, itFn};
}

function describeMany(...args) {
	const methods = [];
	const them = [];
	const labels = [];
	for (const arg of args) {
		if (arg instanceof Array) {
			const [methodName, methodType] = arg;
			const methodLabel = methodType === 'promise' ? `fs.promises.${methodName}` : `fs.${methodName}`;
			const methodNamespace = methodType === 'promise' ? fs.promises : fs;
			arg.push(methodLabel, methodNamespace);
			methods.push(arg);
			labels.push(methodLabel);
		} else {
			them.push(arg);
		}
	}
	describe(`Test ${labels.join(', ')}`, async () => {
		for (const {itLabel, itFn} of them) {
			for (const [methodName, methodType, methodLabel, methodNamespace] of methods) {
				if (typeof methodNamespace[methodName] !== 'function') {
					continue;
				}
				it(`${itLabel} (${methodLabel})`, makeIt(methodName, methodType, itFn));
			}
		}
	});
}

function makeIt(methodName, methodType, itFn) {
	const __method__ = async (...a) => {
		switch (methodType) {
			case 'promise': {
				try {
					return await fs.promises[methodName](...a);
				} catch (e) {
					return e;
				}
			}
			case 'callback': {
				return await new Promise(resolve => {
					try {
						fs[methodName](...a, (error, result) => {
							resolve(error === null ? result : error);
						});
					} catch (e) {
						resolve(e);
					}
				});
			}
			case 'sync': {
				try {
					return fs[methodName](...a);
				} catch (e) {
					return e;
				}
			}
		}
	};
	return () => itFn(__method__, methodType, methodName);
}

module.exports = {
	describeMany,
	they,
	withTempFiles,
};

