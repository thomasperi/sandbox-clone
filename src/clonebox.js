const os = require('os');
const fs = require('fs');
const path = require('path');
const { sandbox, unbox } = require('./sandbox.js');

async function clonebox({source, encodings} = {}) {
	const prefix = path.join(os.tmpdir(), 'clonebox-');
	const dtemp = await fs.promises.mkdtemp(prefix);
	const cloneName = source ? path.basename(source) : 'base';
	const base = path.join(dtemp, cloneName);
	await setup(source, base);
	return {
		base: () => base,
		run: (fn) => run(base, fn),
		snapshot: () => snapshot(base, encodings || {}),
		destroy: () => destroy(dtemp),
		diff,
	};
}

async function setup(source, base) {
	if (source && fs.existsSync(source)) {
		await copy(source, base);
	} else {
		await fs.mkdir(base, {recursive: true});
	}
}

async function copy(source, dest) {
	if (await fs.stat(source).isDirectory()) {
		await fs.mkdir(dest, {recursive: true});
		for (const item of await fs.readdir(source)) {
			if (item === '.' || item  === '..') {
				continue;
			}
			await copy(path.join(source, item), path.join(dest, item));
		}
	} else {
		await fs.copyFile(source, dest);
	}
}

async function run(base, fn) {
	try {
		sandbox(base);
		await fn(base);
	} finally {
		unbox();
	}
}

async function snapshot(base, encodings) {
	const files = {};
	const encounter = async (absPath) => {
		const stat = await fs.stat(absPath);
		if (stat.isDirectory()) {
			for (const subItem of await fs.readdir(absPath)) {
				await encounter(path.join(absPath, subItem));
			}
		} else if (stat.isFile()) {
			const relPath = path.relative(base, absPath);
			const dotExt = path.extname(absPath);
			files[relPath] = await fs.readFile(
				absPath,
				encodings[dotExt] || encodings[dotExt.substring(1)] || 'utf8'
			);
		}
	};
	encounter(base);
	return files;
}

async function destroy(dtemp) {
	await fs.rm(dtemp, {recursive: true, force: true});
}

function diff(before, after) {
	const modified = [];
	const removed = [];
	const created = [];

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
		if (before[key] !== after[key]) {
			modified.push(key);
		}
	}

	return {
		modified,
		removed,
		created,
	};
}

module.exports = { clonebox, diff };
