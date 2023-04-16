const fs = require('fs');
const path = require('path');
const { promiseMethods, fsMethods } = require('./methods.js');

let sandboxDirs = null;

const realMembers = {promises: {}};
assignMembers(fs, realMembers);

const fakeMembers = {promises: {}};
for (const methodName of Object.keys(fsMethods)) {
	fakeMembers[methodName] = createProxy(realMembers, fsMethods, methodName);
}
for (const methodName of Object.keys(promiseMethods)) {
	fakeMembers.promises[methodName] = createProxy(realMembers.promises, promiseMethods, methodName);
}

function sandbox(...dirs) {
	if (sandboxDirs) {
		throw `already sandboxed to ${sandboxDirs.join(', ')}`;
	}
	sandboxDirs = dirs;
	assignMembers(fakeMembers, fs);
}

function unbox() {
	assignMembers(realMembers, fs);
	sandboxDirs = null;
}

function isBoxed() {
	return !!sandboxDirs;
}

function assignMembers(source, target) {
	for (const methodName of Object.keys(fsMethods)) {
		target[methodName] = source[methodName];
	}
	for (const methodName of Object.keys(promiseMethods)) {
		target.promises[methodName] = source.promises[methodName];
	}
}

function createProxy(realNamespace, methodPaths, methodName) {
	return function (...args) {
		// fs cp seem to cache the fs methods however it finds them,
		// so putting the verify behind this condition ensures that
		// even if the fake method continues to be called, it will act
		// like the real one unless sandbox directories are defined.
		if (sandboxDirs) {
			verifyArgs(methodPaths, methodName, args);
		}
		return realNamespace[methodName](...args);
	};
}

function verifyArgs(methodPaths, methodName, args) {
	switch (methodName) {
		case 'access':
		case 'accessSync': {
			if (args[1] & fs.constants.W_OK) {
				verifyPath(args[0]);
			}
			break;
		}
		case 'open':
		case 'openSync': {
			if (/[aw+]/i.test(args[1])) {
				verifyPath(args[0]);
			}
			break;
		}
		default: {
			const indexes = methodPaths[methodName].map(pathIndex => {
				const index = Math.abs(pathIndex);
				const noDeref = index !== pathIndex;
				return [index - 1, noDeref];
			});
			for (const [index, noDeref] of indexes) {
				verifyPath(args[index], noDeref);
			}
		}
	}
}

function verifyPath(pathToVerify, noDeref) {
	if (typeof pathToVerify === 'string') {

		if (fs.existsSync(pathToVerify) && sandboxDirs.includes(fs.realpathSync(pathToVerify))) {
			throw {
				code: 'IS_SANDBOX',
				path: pathToVerify,
				sandboxes: sandboxDirs,
				msg: `${pathToVerify} is one of the sandbox directories itself (${sandboxDirs.join(', ')})`,
			};
		}
		
		if (noDeref) {
			// If this path is expected to be a link,
			// only its parent and ancestors need to be real and inside the sandbox.
			pathToVerify = path.dirname(pathToVerify);
		}
		pathToVerify = realExistingPartOfPath(pathToVerify);
		if (!sandboxDirs.some(sandboxDir => isInside(pathToVerify, sandboxDir, true))) {
			throw {
				code: 'OUTSIDE_SANDBOX',
				path: pathToVerify,
				sandboxes: sandboxDirs,
				msg: `${pathToVerify} is outside the sandbox directories (${sandboxDirs.join(', ')})`,
			};
		}
		
	}
}

function realExistingPartOfPath(pathName) {
	try {
		return fs.realpathSync(pathName);
	} catch (e) {
		// realpathSync's error provides the first real part of the path that didn't exist,
		// so back out one directory and we've got the part that does exist.
		return fs.realpathSync(path.dirname(e.path));
	}
}

// thanks to: https://github.com/sindresorhus/is-path-inside/blob/v4.0.0/index.js
function isInside(child, parent, inclusive = false) {
	const relative = path.relative(parent, child);
	return (
		(relative || inclusive) &&
		relative !== '..' &&
		!relative.startsWith(`..${path.sep}`) &&
		!path.isAbsolute(relative)
	);
}

module.exports = { sandbox, unbox, isBoxed };
