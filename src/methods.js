// Map the sandboxable fs and fs.promises methods
// to which arguments are paths to be verified.

// Indices start at 1.

// A negative index indicates that the path's parent should be sandboxed instead,
// for the case of symlinks that won't be dereferenced

// to-do: determine if any other methods should get negatives.

const promiseMethods = {
	access: [1],
	appendFile: [1],
	chmod: [1],
	chown: [1],
	copyFile: [2], // follows existing dest symlink and replaces its realpath with a copy of src file
	cp: [-2], // replaces existing dest symlink itself with a copy of src file
	lchmod: [1],
	lchown: [1],
	lutimes: [-1],
	link: [2],
	mkdir: [1],
	mkdtemp: [1],
	open: [1],
	rename: [1, -2], // replaces existing newPath symlink itself with file at oldPath
	rmdir: [1],
	rm: [1],
	symlink: [2],
	truncate: [1],
	unlink: [-1],
	utimes: [1],
	writeFile: [1],
};
const fsMethods = {
	
	// Callback API
	
	access: [1],
	appendFile: [1],
	chmod: [1],
	chown: [1],
	copyFile: [2], // see note in promise above
	cp: [-2], // see note in promise above
	createWriteStream: [1],
	lchmod: [1],
	lchown: [1],
	lutimes: [-1],
	link: [2],
	mkdir: [1],
	mkdtemp: [1],
	open: [1],
	rename: [1, -2], // see note in promise above
	rmdir: [1],
	rm: [1],
	symlink: [2],
	truncate: [1],
	unlink: [-1],
	utimes: [1],
	writeFile: [1],
	
	// Synchronous API
	
	accessSync: [1],
	appendFileSync: [1],
	chmodSync: [1],
	chownSync: [1],
	copyFileSync: [2], // see note in promise above
	cpSync: [-2], // see note in promise above
	lchmodSync: [1],
	lchownSync: [1],
	lutimesSync: [-1],
	linkSync: [2],
	mkdirSync: [1],
	mkdtempSync: [1],
	openSync: [1],
	renameSync: [1, -2], // see note in promise above
	rmdirSync: [1],
	rmSync: [1],
	symlinkSync: [2],
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
