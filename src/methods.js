// Map the sandboxable fs and fs.promises methods
// to which arguments are paths to be verified.

// Indices start at 1.

// A negative index indicates that the path's parent should be sandboxed instead,
// for the case of symlinks that won't be dereferenced

const promiseMethods = {
	access: [1],
	appendFile: [1],
	chmod: [1],
	chown: [1],
	copyFile: [2], // real method dereferences pre-existing `dest` symlink.
	cp: [-2], // real method doesn't dereference pre-existing `dest` symlink. `{dereference: true}` only dereferences `src`.
	lchmod: [-1],
	lchown: [-1],
	lutimes: [-1],
	link: [-2], // real method fails if `newPath` pre-exists at all, so that should be the error that gets thrown.
	mkdir: [1],
	mkdtemp: [1],
	open: [1],
	rename: [1, -2], // real method doesn't dereference pre-existing `newPath` symlink.
	rmdir: [1],
	rm: [1],
	symlink: [-2], // real method fails if `newPath` pre-exists at all, so that should be the error that gets thrown.
	truncate: [1], // to-do: verify that the real method dereferences.
	unlink: [-1], // to-do: verify that the real method doesn't dereference.
	utimes: [1],
	writeFile: [1], // to-do: verify that the real method dereferences.
};
const fsMethods = {
	
	// Callback API
	
	access: [1],
	appendFile: [1],
	chmod: [1],
	chown: [1],
	copyFile: [2],
	cp: [-2],
	createWriteStream: [1],
	lchmod: [-1],
	lchown: [-1],
	lutimes: [-1],
	link: [-2],
	mkdir: [1],
	mkdtemp: [1],
	open: [1],
	rename: [1, -2],
	rmdir: [1],
	rm: [1],
	symlink: [-2],
	truncate: [1],
	unlink: [-1],
	utimes: [1],
	writeFile: [1],
	
	// Synchronous API
	
	accessSync: [1],
	appendFileSync: [1],
	chmodSync: [1],
	chownSync: [1],
	copyFileSync: [2],
	cpSync: [-2],
	lchmodSync: [-1],
	lchownSync: [-1],
	lutimesSync: [-1],
	linkSync: [-2],
	mkdirSync: [1],
	mkdtempSync: [1],
	openSync: [1],
	renameSync: [1, -2],
	rmdirSync: [1],
	rmSync: [1],
	symlinkSync: [-2],
	truncateSync: [1],
	unlinkSync: [-1],
	utimesSync: [1],
	writeFileSync: [1],
};

module.exports = {promiseMethods, fsMethods};

/*

NOT SANDBOXED:

fs.promises.lstat (ro)
fs.promises.opendir (ro)
fs.promises.readdir (ro)
fs.promises.readFile (ro)
fs.promises.readlink (ro)
fs.promises.realpath (ro)
fs.promises.stat (ro)
fs.promises.statfs (ro)
fs.promises.watch (ro)
fs.close (fd, ro)
fs.createReadStream (ro)
fs.exists (ro)
fs.fchmod (fd)
fs.fchown (fd)
fs.fdatasync (fd)
fs.fstat (fd, ro)
fs.fsync (fd)
fs.ftruncate (fd)
fs.futimes (fd)
fs.lstat (ro)
fs.openAsBlob (ro)
fs.opendir (ro)
fs.read (fd, ro)
fs.readdir (ro)
fs.readFile (ro)
fs.readlink (ro)
fs.readv (fd, ro)
fs.realpath (ro)
fs.stat (ro)
fs.statfs (ro)
fs.unwatchFile (ro)
fs.watch (ro)
fs.watchFile (ro)
fs.write (fd)
fs.writev (fd)
fs.closeSync (fd, ro)
fs.existsSync (ro)
fs.fchmodSync (fd)
fs.fchownSync (fd)
fs.fdatasyncSync (fd)
fs.fstatSync (fd)
fs.fsyncSync (fd)
fs.ftruncateSync (fd)
fs.futimesSync (fd)
fs.lstatSync (ro)
fs.opendirSync (ro)
fs.readdirSync (ro)
fs.readFileSync (ro)
fs.readlinkSync (ro)
fs.readSync (fd, ro)
fs.readvSync (fd, ro)
fs.realpathSync (ro)
fs.statSync (ro)
fs.statfsSync (ro)
fs.writeSync (fd)
fs.writevSync (fd)
*/
