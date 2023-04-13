const os = require('os');
const fs = require('fs');
const path = require('path');
const { sandbox, unbox } = require('./sandbox.js');

function Clonebox({source, encodings} = {}) {
	const prefix = path.join(os.tmpdir(), 'clonebox-');
	const dtemp = fs.mkdtempSync(prefix);
	const cloneName = source ? path.basename(source) : 'base';
	const base = path.join(dtemp, cloneName);

	let destroyed = false;
	
	setup(source, base);
	
	this.base = () => base;
	
	this.snapshot = () => {
		not(destroyed, 'snapshot');
		return snapshot(base, encodings || {});
	};
	
	this.run = (fn) => {
		not(destroyed, 'run');
		return run(base, fn);
	};
	
	this.destroy = () => {
		if (destroyed) {
			return;
		}
		destroy(dtemp);
		destroyed = true;
	};
	
	this.diff = diff;
}

function not(destroyed, method) {
	if (destroyed) {
		throw `can't ${method} a destroyed Clonebox`;
	}
}

function setup(source, base) {
	if (source && fs.existsSync(source)) {
		copy(source, base);
	} else {
		fs.mkdirSync(base, {recursive: true});
	}
}

function copy(source, dest) {
	if ((fs.statSync(source)).isDirectory()) {
		fs.mkdirSync(dest, {recursive: true});
		for (const item of fs.readdirSync(source)) {
			if (item === '.' || item  === '..') {
				continue;
			}
			copy(path.join(source, item), path.join(dest, item));
		}
	} else {
		fs.copyFileSync(source, dest);
	}
}

function run(base, fn) {
	let result;
	try {
		sandbox(base);
		result = fn(base);
	} finally {
		unbox();
	}
	return result;
}

function snapshot(base, encodings) {
	const files = {};
	const encounter = (absPath) => {
		const stat = fs.statSync(absPath);
		if (stat.isDirectory()) {
			for (const subItem of fs.readdirSync(absPath)) {
				encounter(path.join(absPath, subItem));
			}
		} else if (stat.isFile()) {
			const relPath = path.relative(base, absPath);
			const dotExt = path.extname(absPath);
			files[relPath] = fs.readFileSync(
				absPath,
				encodings[dotExt] || encodings[dotExt.substring(1)] || 'utf8'
			);
		}
	};
	encounter(base);
	return files;
}

function destroy(dtemp) {
	fs.rmSync(dtemp, {recursive: true, force: true});
}

function diff(before, after) {
	const created = [];
	const modified = [];
	const removed = [];
	const unchanged = [];

	const beforeKeys = Object.keys(before);
	const afterKeys = Object.keys(after);
	const commonKeys = [];

	for (const key of beforeKeys) {
		if (afterKeys.includes(key)) {
			commonKeys.push(key);
		} else {
			removed.push(key);
		}
	}
	for (const key of afterKeys) {
		if (!beforeKeys.includes(key)) {
			created.push(key);
		}
	}
	for (const key of commonKeys) {
		if (before[key] === after[key]) {
			unchanged.push(key);
		} else {
			modified.push(key);
		}
	}

	return {
		created,
		modified,
		removed,
		unchanged,
	};
}

module.exports = { Clonebox };
