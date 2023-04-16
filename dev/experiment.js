const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'experiment-'));
try {
	fs.mkdirSync(`${temp}/foo/bar/zote`, {recursive: true});
	fs.writeFileSync(`${temp}/foo/bar/zote/sbor.txt`, 'sbor', 'utf8');
	fs.writeFileSync(`${temp}/foo/bar/zote/thed.txt`, 'thed', 'utf8');
	fs.symlinkSync(`${temp}/foo/bar/zote`, `${temp}/thed`);
	
	fs.rmSync(`${temp}/foo`, {recursive: true});

	console.log('----before----\n', execSync(`ls -lR ${temp}`, {encoding: 'utf8'}));

	fs.mkdirSync(`${temp}/foo/bar`, {recursive: true});

	console.log('----after----\n', execSync(`ls -lR ${temp}`, {encoding: 'utf8'}));

	// fs.rmdirSync(`${temp}/sbor`);
	// 
	// execSync(`ls -lR ${temp}`);

} finally {
	fs.rmSync(temp, {recursive: true, force: true});
}
