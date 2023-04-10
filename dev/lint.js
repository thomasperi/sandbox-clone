const { ESLint } = require('eslint');

module.exports = function (path) {
	(async function () {
		// 1. Create an instance.
		const eslint = new ESLint();

		// 2. Lint files.
		const results = await eslint.lintFiles([path]);

		// 3. Format the results.
		const formatter = await eslint.loadFormatter('stylish');
		const resultText = formatter.format(results);

		// 4. Output it.
		console.log(resultText);
	})().catch((error) => {
		process.exitCode = 1;
		console.error(error);
	});
};
