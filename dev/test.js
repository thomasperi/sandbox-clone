/*global describe, it */
const os = require('os');
const fs = require('fs');
const path = require('path').posix;

const tmp = os.tmpdir();
const testDir = path.join(tmp, 'test-sandbox-fs');
const sandboxDir = path.join(testDir, 'the-sandbox');
const goodFile = path.join(sandboxDir, 'good-file');
const badFile = path.join(testDir, 'bad-file');

async function withTempFiles(fn) {
	if (fs.existsSync(testDir)) {
		throw `${testDir} already exists, delete manually`;
	}
	try {
		fs.mkdirSync(sandboxDir, {recursive: true});
		fs.writeFileSync(goodFile, 'good', 'utf8');
		fs.writeFileSync(badFile, 'bad', 'utf8');
		await fn(sandboxDir);
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
	return async () => {
		switch (methodType) {
			case 'promise': {
				await itFn(async (...a) => {
					try {
						return await fs.promises[methodName](...a);
					} catch (e) {
						return e;
					}
				});
				break;
			}
			case 'callback': {
				await itFn((...a) => new Promise(resolve => {
					try {
						fs[methodName](...a, (error, result) => {
							resolve(error === null ? result : error);
						});
					} catch (e) {
						resolve(e);
					}
				}));
				break;
			}
			case 'sync': {
				await itFn(async (...a) => {
					try {
						return fs[methodName](...a);
					} catch (e) {
						return e;
					}
				});
				break;
			}
		}
	};
}

module.exports = {
	sandboxDir,
	goodFile,
	badFile,
	describeMany,
	they,
	withTempFiles,
};
