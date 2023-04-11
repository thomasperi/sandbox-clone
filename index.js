// to-do: Add mkdtemp to the list.
// It will need special treatment because the path of the directory being created 
// doesn't come from any of the arguments to the method.

const fs = require('fs');
const path = require('path');

const fsMethods = {
	access: 1,
	appendFile: 1,
	chmod: 1,
	chown: 1,
	copyFile: 2,
	cp: 2,
	createReadStream: 1,
	createWriteStream: 1,
	exists: 1,
	lchmod: 1,
	lchown: 1,
	lutimes: 1,
	link: 2,
	mkdir: 1,
	// mkdtemp: 1,
	open: 1,
	openAsBlob: 1,
	opendir: 1,
	rename: 2,
	rmdir: 1,
	rm: 1,
	truncate: 1,
	unlink: 1,
	utimes: 1,
	writeFile: 1,
	accessSync: 1,
	appendFileSync: 1,
	chmodSync: 1,
	chownSync: 1,
	copyFileSync: 2,
	cpSync: 2,
	lchmodSync: 1,
	lchownSync: 1,
	lutimesSync: 1,
	linkSync: 2,
	mkdirSync: 1,
	// mkdtempSync: 1,
	opendirSync: 1,
	openSync: 1,
	renameSync: 2,
	rmdirSync: 1,
	rmSync: 1,
	symlink: 2,
	symlinkSync: 2,
	truncateSync: 1,
	unlinkSync: 1,
	utimesSync: 1,
	writeFileSync: 1,
};
const promiseMethods = {
	access: 1,
	appendFile: 1,
	chmod: 1,
	chown: 1,
	copyFile: 2,
	cp: 2,
	lchmod: 1,
	lchown: 1,
	lutimes: 1,
	link: 2,
	mkdir: 1,
	// mkdtemp: 1,
	open: 1,
	opendir: 1,
	rename: 2,
	rmdir: 1,
	rm: 1,
	symlink: 2,
	truncate: 1,
	unlink: 1,
	utimes: 1,
	writeFile: 1,
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

function getProxy(realNamespace, pathCounts, methodName, sandboxDirs) {
	switch (methodName) {
		case 'rename':
		case 'renameSync': return function (existingPath, newPath, ...args) {
			verify(existingPath, sandboxDirs);
			verify(newPath, sandboxDirs);
			return realNamespace[methodName](existingPath, newPath, ...args);
		};
		default: switch (pathCounts[methodName]) {
			case 1: return function (path, ...args) {
				verify(path, sandboxDirs);
				return realNamespace[methodName](path, ...args);
			};
			case 2: return function (existingPath, newPath, ...args) {
				verify(newPath, sandboxDirs);
				return realNamespace[methodName](existingPath, newPath, ...args);
			};
		}
	}
}

function verify(pathToVerify, sandboxDirs) {
	// to-do:
	// Use realpath to reject paths with symlinks that resolve outside the sandbox.
	// Exempt the methods that are reading the symlinks themselves.
	
	if (typeof pathToVerify === 'string') {
		pathToVerify = path.resolve(pathToVerify);
		if (!sandboxDirs.some(sandboxDir => isInside(pathToVerify, sandboxDir, true))) {
			throw `${pathToVerify} is outside the sandbox directories (${sandboxDirs.join(', ')})`;
		}
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
		relative = path.dirname(relative);
		switch (relative) {
			case '.': return true;
			case '..': return false;
		}
	}
}

module.exports = sandboxFs;
