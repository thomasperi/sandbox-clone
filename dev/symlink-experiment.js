const fs = require('fs');
const os = require('os');
const path = require('path');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'symlink-experiment-'));

const fileA = path.join(temp, 'a.txt');
const fileB = path.join(temp, 'b.txt');
const linkC = path.join(temp, 'c.txt');

function useMethod(method) {
	console.log(method);

	// Start fresh
	fs.rmSync(temp, {recursive: true, force: true});
	fs.mkdirSync(temp);
	fs.writeFileSync(fileA, 'AAA', 'utf8');
	fs.writeFileSync(fileB, 'BBB', 'utf8');
	fs.symlinkSync(fileB, linkC);

	// Call the method
	try {
		fs[method](fileA, linkC);
	} catch (e) {
		console.log(e);
	}

	// Read the files
	const readA = fs.readFileSync(fileA, 'utf8');
	const readB = fs.readFileSync(fileB, 'utf8');
	console.log({readA, readB});
}

console.log(temp);

useMethod('copyFileSync');
useMethod('cpSync');
useMethod('linkSync');
useMethod('symlinkSync');

// output:

// copyFileSync
// { readA: 'AAA', readB: 'AAA' }
// cpSync
// { readA: 'AAA', readB: 'BBB' }

// Conclusion:
// copyFileSync follows existing dest symlink and replaces its realpath with a copy of src file
// cpSync replaces existing dest symlink with a copy of src file
