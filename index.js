// to-do: Allow multiple allowed directories

// to-do: Add mkdtemp to the list.
// It will need special treatment because the path of the directory being created 
// doesn't come from any of the arguments to the method.

const fs = require('fs');
const path = require('path');

const has = Object.prototype.hasOwnProperty;

const fsStashed = stash(
	fs,
	{
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
		lstat: 1,
		mkdir: 1,
		// 		mkdtemp: 1,
		open: 1,
		openAsBlob: 1,
		opendir: 1,
		readdir: 1,
		readFile: 1,
		readlink: 1,
		realpath: 1,
		rename: 2,
		rmdir: 1,
		rm: 1,
		stat: 1,
		statfs: 1,
		truncate: 1,
		unlink: 1,
		unwatchFile: 1,
		utimes: 1,
		watch: 1,
		watchFile: 1,
		writeFile: 1,
		accessSync: 1,
		appendFileSync: 1,
		chmodSync: 1,
		chownSync: 1,
		copyFileSync: 2,
		cpSync: 2,
		existsSync: 1,
		lchmodSync: 1,
		lchownSync: 1,
		lutimesSync: 1,
		linkSync: 2,
		lstatSync: 1,
		mkdirSync: 1,
		// 		mkdtempSync: 1,
		opendirSync: 1,
		openSync: 1,
		readdirSync: 1,
		readFileSync: 1,
		readlinkSync: 1,
		realpathSync: 1,
		renameSync: 2,
		rmdirSync: 1,
		rmSync: 1,
		statSync: 1,
		statfsSync: 1,
		symlink: 0, // special case for symlinks
		symlinkSync: 0, // special case for symlinks
		truncateSync: 1,
		unlinkSync: 1,
		utimesSync: 1,
		writeFileSync: 1,
	}
);

const promisesStashed = stash(
	fs.promises,
	{
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
		lstat: 1,
		mkdir: 1,
		// 		mkdtemp: 1,
		open: 1,
		opendir: 1,
		readdir: 1,
		readFile: 1,
		readlink: 1,
		realpath: 1,
		rename: 2,
		rmdir: 1,
		rm: 1,
		stat: 1,
		statfs: 1,
		symlink: 0, // special case for symlinks
		truncate: 1,
		unlink: 1,
		utimes: 1,
		watch: 1,
		writeFile: 1,
	}
);

function stash(imported, argCounts) {
	const unmonkeyed = Object.assign({}, imported);
	const bound = {};
	for (const key of Object.keys(imported)) {
		let val = imported[key];
		if (has.call(argCounts, key) && typeof val === 'function') {
			val = val.bind(unmonkeyed);
		}
		bound[key] = val;
	}
	return {imported, unmonkeyed, bound, argCounts};
}

function unmonkey(stashed) {
	const { imported, unmonkeyed, argCounts } = stashed;
	Object.keys(argCounts).forEach(key => {
		imported[key] = unmonkeyed[key];
	});
}

function monkey(stashed, sandboxDir) {
	const { imported, bound, argCounts } = stashed;
	Object.keys(argCounts).forEach(key => {
		const count = argCounts[key];
		if (count > 0) {
			imported[key] = function (...args) {
				for (let i = 0; i < count; i++) {
					verify(args[i], sandboxDir);
				}
				return bound[key](...args);
			};
		} else { // special case for symlinks
			imported[key] = function (target, link, ...args) {
				const linkAbs = path.resolve(link);
				const linkParent = path.dirname(linkAbs);
				const targetAbs = path.isAbsolute(target) ? target : path.join(linkParent, target);
				verify(targetAbs, sandboxDir);
				verify(linkAbs, sandboxDir);
				return bound[key](target, link, ...args);
			};
		}
	});
}

function monkeyRealpathNative(sandboxDir) {
	['realpath', 'realpathSync'].forEach(key => {
		const monkeyed = fs[key];
		const unmonkeyed = fsStashed.unmonkeyed[key];
		if (monkeyed === unmonkeyed) { // then it's not really monkeyed
			throw `fs.${key} should be monkeyed before monkeyRealPathNative() is called`;
		}
		const bound = unmonkeyed.native.bind(monkeyed);
		monkeyed.native = function (path, ...args) {
			verify(path, sandboxDir);
			return bound(path, ...args);
		};
	});
}

function verify(pathToVerify, sandboxDir) {
	// to-do:
	// Use realpath to reject paths with symlinks that resolve outside the sandbox.
	// Exempt the methods that are reading the symlinks themselves.
	
	if (typeof pathToVerify === 'string') {
		pathToVerify = path.resolve(pathToVerify);
		if (!isInside(pathToVerify, sandboxDir, true)) {
			throw `${pathToVerify} is outside the sandbox directory ${sandboxDir}`;
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

function sandboxFs(dir) {
	dir = path.resolve(dir);
	monkey(fsStashed, dir);
	monkey(promisesStashed, dir);
	monkeyRealpathNative(dir);
	return () => {
		unmonkey(fsStashed);
		unmonkey(promisesStashed);
		// There's no need to unmonkey the realpath.native methods since they were only
		// mounted onto the monkeyed realpath methods, not the genuine ones.
	};
}

module.exports = sandboxFs;
