const fs = require('fs');
const path = require('path');
const { promiseMethods, fsMethods } = require('./methods.js');

let _isBoxed = false;

const realMembers = {promises: {}};
for (const methodName of Object.keys(fsMethods)) {
	realMembers[methodName] = fs[methodName];
}
for (const methodName of Object.keys(promiseMethods)) {
	realMembers.promises[methodName] = fs.promises[methodName];
}

function sandbox(...dirs) {
	const fakeMembers = {promises: {}};
	for (const methodName of Object.keys(fsMethods)) {
		fakeMembers[methodName] = createProxy(realMembers, fsMethods, methodName, dirs);
	}
	for (const methodName of Object.keys(promiseMethods)) {
		fakeMembers.promises[methodName] = createProxy(realMembers.promises, promiseMethods, methodName, dirs);
	}
	assign(fakeMembers);
	_isBoxed = true;
}

function unbox() {
	assign(realMembers);
	_isBoxed = false;
}

function isBoxed() {
	return _isBoxed;
}

function assign(members) {
	for (const methodName of Object.keys(fsMethods)) {
		fs[methodName] = members[methodName];
	}
	for (const methodName of Object.keys(promiseMethods)) {
		fs.promises[methodName] = members.promises[methodName];
	}
}

function createProxy(realNamespace, methodPaths, methodName, sandboxDirs) {
	return function (...args) {
		verifyArgs(methodPaths, methodName, sandboxDirs, args);
		return realNamespace[methodName](...args);
	};
}

function verifyArgs(methodPaths, methodName, sandboxDirs, args) {
	switch (methodName) {
		case 'access':
		case 'accessSync': {
			if (args[1] & fs.constants.W_OK) {
				verifyPath(args[0], sandboxDirs);
			}
			break;
		}
		case 'open':
		case 'openSync': {
			if (/[aw+]/i.test(args[1])) {
				verifyPath(args[0], sandboxDirs);
			}
			break;
		}
		default: {
			const indexes = methodPaths[methodName].map(pathIndex => {
				const index = Math.abs(pathIndex);
				const expectsLink = index !== pathIndex;
				return [index - 1, expectsLink];
			});
			for (const [index, expectsLink] of indexes) {
				verifyPath(args[index], sandboxDirs, expectsLink);
			}
		}
	}
}

function verifyPath(pathToVerify, sandboxDirs, expectsLink) {
	if (typeof pathToVerify === 'string') {
		if (expectsLink) {
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
		return fs.realpathSync.native(pathName);
	} catch (e) {
		// Unlike the native and promises versions of realpath,
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
