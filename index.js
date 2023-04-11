// to-do: Add mkdtemp to the list.
// It will need special treatment because the path of the directory being created 
// doesn't come from any of the arguments to the method.

const fs = require('fs');
const path = require('path');

const fsMethods = {
	access: [0],
	appendFile: [0],
	chmod: [0],
	chown: [0],
	copyFile: [1],
	cp: [1],
	createReadStream: [0],
	createWriteStream: [0],
	exists: [0],
	lchmod: [0],
	lchown: [0],
	lutimes: [0],
	link: [1],
	mkdir: [0],
	// mkdtemp: [0],
	open: [0],
	openAsBlob: [0],
	opendir: [0],
	rename: [0, 1],
	rmdir: [0],
	rm: [0],
	truncate: [0],
	unlink: [0],
	utimes: [0],
	writeFile: [0],
	accessSync: [0],
	appendFileSync: [0],
	chmodSync: [0],
	chownSync: [0],
	copyFileSync: [1],
	cpSync: [1],
	lchmodSync: [0],
	lchownSync: [0],
	lutimesSync: [0],
	linkSync: [1],
	mkdirSync: [0],
	// mkdtempSync: [0],
	opendirSync: [0],
	openSync: [0],
	renameSync: [0, 1],
	rmdirSync: [0],
	rmSync: [0],
	symlink: [1],
	symlinkSync: [1],
	truncateSync: [0],
	unlinkSync: [0],
	utimesSync: [0],
	writeFileSync: [0],
};
const promiseMethods = {
	access: [0],
	appendFile: [0],
	chmod: [0],
	chown: [0],
	copyFile: [1],
	cp: [1],
	lchmod: [0],
	lchown: [0],
	lutimes: [0],
	link: [1],
	mkdir: [0],
	// mkdtemp: [0],
	open: [0],
	opendir: [0],
	rename: [0, 1],
	rmdir: [0],
	rm: [0],
	symlink: [1],
	truncate: [0],
	unlink: [0],
	utimes: [0],
	writeFile: [0],
};

const realMembers = {promises: {}};
for (const methodName of Object.keys(fsMethods)) {
	realMembers[methodName] = fs[methodName];
}
for (const methodName of Object.keys(promiseMethods)) {
	realMembers.promises[methodName] = fs.promises[methodName];
}

function sandboxFs(...dirs) {
	const fakeMembers = {promises: {}};
	for (const methodName of Object.keys(fsMethods)) {
		fakeMembers[methodName] = getProxy(realMembers, fsMethods, methodName, dirs);
	}
	for (const methodName of Object.keys(promiseMethods)) {
		fakeMembers.promises[methodName] = getProxy(realMembers.promises, promiseMethods, methodName, dirs);
	}
	assign(fakeMembers);
	return unbox;
}

function unbox() {
	assign(realMembers);
}

function assign(members) {
	for (const methodName of Object.keys(fsMethods)) {
		fs[methodName] = members[methodName];
	}
	for (const methodName of Object.keys(promiseMethods)) {
		fs.promises[methodName] = members.promises[methodName];
	}
}

function getProxy(realNamespace, methodPaths, methodName, sandboxDirs) {
	const pathIndices = methodPaths[methodName];
	switch (methodName) {
		case 'access':
		case 'accessSync': return function (...args) {
			if (args[1] & fs.constants.W_OK) {
				verify(args[0], sandboxDirs);
			}
			return realNamespace[methodName](...args);
		};
		default: return function (...args) {
			for (const pathIndex of pathIndices) {
				verify(args[pathIndex], sandboxDirs);
			}
			return realNamespace[methodName](...args);
		};
	}
}

function verify(pathToVerify, sandboxDirs) {
	if (typeof pathToVerify === 'string') {
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

function isInside(child, parent, inclusive = false) {
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

module.exports = sandboxFs;
