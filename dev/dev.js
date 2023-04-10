const { posix: path } = require('path');
const { spawn } = require('child_process');
const chokidar = require('chokidar');
const lint = require('./lint.js');

const project = path.resolve(`${__dirname}/..`);
const files = {
	dev: `${project}/dev/*.js`,
	src: `${project}/index.js`,
	tests: `${project}/test/*.js`,
};

function lintDev() {
	console.log('lint dev', new Date());
	lint(files.dev);
}

function lintSrc() {
	console.log('lint src', new Date());
	lint(files.src);
}

function lintTests() {
	console.log('lint tests', new Date());
	lint(files.tests);
}

function lintFile(file) {
	console.log('lint file', file, new Date());
	lint(file);
}

function runTests() {
	console.log('run tests', new Date());
	// Run tests as a child process so as not to need to clear the require cache.
	const command = 'npx mocha';// --reporter nyan';
	const tokens = command.split(/\s+/);
	spawn(tokens.shift(), tokens, { stdio: 'inherit' });
}

lintDev();
lintSrc();
lintTests();
runTests();

chokidar.watch(
	[files.dev, files.src, files.tests],
	{ignoreInitial: true}
).on('all', (event, path) => {
	if (path !== __filename) {
		console.log(event, path, new Date());
		lintFile(path);
		runTests();
	}
});
