const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { FAIL, boxed, testFeature, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

const allowedLink = `${allowedFile}-link`;
const disallowedLink = `${disallowedFile}-link`;

testFeature({
	methods: [
		['link', 'promise'],
		['link', 'callback'],
		['linkSync', 'sync'],
	],
	attempts: [
		async methodProxy => {
			const result = await boxed(() => methodProxy(allowedFile, allowedLink));
			assert.equal(result, undefined, 'link should succeed with an allowed new link to an allowed existing file');

			fs.writeFileSync(allowedLink, 'foo', 'utf8');
			const foo = fs.readFileSync(allowedFile, 'utf8');
			assert.equal(foo, 'foo', 'writing linked file should reflect in original');

			fs.writeFileSync(allowedFile, 'bar', 'utf8');
			const bar = fs.readFileSync(allowedLink, 'utf8');
			assert.equal(bar, 'bar', 'writing original file should reflect in link');
		},

		async methodProxy => {
			const result = await boxed(() => methodProxy(allowedFile, disallowedLink));
			assert.equal(result, FAIL, 'link should fail with a disallowed new link to an allowed existing file');
			assert(!fs.existsSync(disallowedLink));
		},

		async methodProxy => {
			const result = await boxed(() => methodProxy(disallowedFile, allowedLink));
			assert.equal(result, FAIL, 'link should fail with an allowed new link to a disallowed existing file');
			assert(!fs.existsSync(allowedLink));
		},

		async methodProxy => {
			const result = await boxed(() => methodProxy(disallowedFile, disallowedLink));
			assert.equal(result, FAIL, 'link should fail with a disallowed new link to a disallowed existing file');
			assert(!fs.existsSync(disallowedLink));
		},
	],
});

