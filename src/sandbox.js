const os = require('os');
const fs = require('fs');
const path = require('path');
const { promiseMethods, fsMethods } = require('./methods.js');

const isWindows = os.platform() === 'win32';

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
	if (dirs.length === 0) {
		throw 'at least one sandbox directory must be specified';
	}
	sandboxDirs = dirs.map(dir => resolveELP(dir));
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
	
		pathToVerify = resolveELP(pathToVerify);

		// Consider the sandbox directories themselves off-limits to changes,
		// mainly because it's the easiest way to keep using the parent directory
		// of a path to keep the endpoint of the path from being dereferenced. (That
		// approach would not work on the sandbox directory because the parent is outside.)
		if (fs.existsSync(pathToVerify) && sandboxDirs.includes(fs.realpathSync(pathToVerify))) {
			throw {
				code: 'IS_SANDBOX',
				path: pathToVerify,
				sandboxes: sandboxDirs,
				msg: `${pathToVerify} is one of the sandbox directories itself (${sandboxDirs.join(', ')})`,
			};
		}
		
		if (noDeref) {
			// If this path is not going to be dereferenced by the real method,
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

function isInside(child, parent, inclusive = false) {
	// Rather than try to pick the path apart ourselves, let node do it.
	let relative = path.relative(parent, child);
	if (relative === '') {
		return !!inclusive;
	}
	if (path.isAbsolute(relative)) {
		return false;
	}
	for (;;) {
		switch (relative) {
			case '.': return true;
			case '..': return false;
		}
		relative = path.dirname(relative);
	}
}

// Use extended-length paths on Windows.
const prefixELP = '\\\\?\\';
function resolveELP(p) {
	p = path.resolve(p);
	if (isWindows && !p.startsWith(prefixELP)) {
		p = prefixELP + p;
	}
	return p;
}

module.exports = { sandbox, unbox, isBoxed };
