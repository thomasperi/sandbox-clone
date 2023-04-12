const fs = require('fs');
const path = require('path');

const fsMethods = {
	access: [1],
	appendFile: [1],
	chmod: [1],
	chown: [1],
	copyFile: [2],
	cp: [2],
	createReadStream: [1],
	createWriteStream: [1],
	exists: [1],
	lchmod: [1],
	lchown: [1],
	lutimes: [-1],
	link: [2],
	mkdir: [1],
	mkdtemp: [1],
	open: [1],
	openAsBlob: [1],
	opendir: [1],
	rename: [1, 2],
	rmdir: [1],
	rm: [1],
	truncate: [1],
	unlink: [1],
	utimes: [1],
	writeFile: [1],
	accessSync: [1],
	appendFileSync: [1],
	chmodSync: [1],
	chownSync: [1],
	copyFileSync: [2],
	cpSync: [2],
	lchmodSync: [1],
	lchownSync: [1],
	lutimesSync: [-1],
	linkSync: [2],
	mkdirSync: [1],
	mkdtempSync: [1],
	opendirSync: [1],
	openSync: [1],
	renameSync: [1, 2],
	rmdirSync: [1],
	rmSync: [1],
	symlink: [2],
	symlinkSync: [2],
	truncateSync: [1],
	unlinkSync: [1],
	utimesSync: [1],
	writeFileSync: [1],
};
const promiseMethods = {
	access: [1],
	appendFile: [1],
	chmod: [1],
	chown: [1],
	copyFile: [2],
	cp: [2],
	lchmod: [1],
	lchown: [1],
	lutimes: [-1],
	link: [2],
	mkdir: [1],
	mkdtemp: [1],
	open: [1],
	opendir: [1],
	rename: [1, 2],
	rmdir: [1],
	rm: [1],
	symlink: [2],
	truncate: [1],
	unlink: [1],
	utimes: [1],
	writeFile: [1],
};
// const writeFlags = ['a', 'ax', 'a+', 'ax+', 'as', 'as+', 'r+', 'rs+', 'w', 'wx', 'w+', 'wx+'];

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
	switch (methodName) {
		case 'access':
		case 'accessSync': return function (...args) {
			if (args[1] & fs.constants.W_OK) {
				verify(args[0], sandboxDirs);
			}
			return realNamespace[methodName](...args);
		};
		case 'open':
		case 'openSync': {
			return function (...args) {
				// if (writeFlags.includes(args[1])) {
				if (/[aw+]/i.test(args[1])) {
					verify(args[0], sandboxDirs);
				}
				return realNamespace[methodName](...args);
			};
		}
		default: {
			const indexes = methodPaths[methodName].map(pathIndex => {
				const index = Math.abs(pathIndex);
				const expectsLink = index !== pathIndex; // negative
				return [index - 1, expectsLink];
			});
			return function (...args) {
				for (const [index, expectsLink] of indexes) {
					verify(args[index], sandboxDirs, expectsLink);
				}
				return realNamespace[methodName](...args);
			};
		}
	}
}

function verify(pathToVerify, sandboxDirs, expectsLink) {
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

module.exports = sandboxFs;
