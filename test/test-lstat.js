const fs = require('fs'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { FAIL, boxed, testFeature, disallowedFile, allowedFile } = require('../dev/test.js'); // eslint-disable-line no-unused-vars

const allowedLinkToAllowedFile = `${allowedFile}-link-to-allowed`;
const disallowedLinkToAllowedFile = `${disallowedFile}-link-to-allowed`;
const allowedLinkToDisallowedFile = `${allowedFile}-link-to-disallowed`;
const disallowedLinkToDisallowedFile = `${disallowedFile}-link-to-disallowed`;

function makeLinks() {
	fs.symlinkSync(allowedFile, allowedLinkToAllowedFile);
	fs.symlinkSync(allowedFile, disallowedLinkToAllowedFile);
	fs.symlinkSync(disallowedFile, allowedLinkToDisallowedFile);
	fs.symlinkSync(disallowedFile, disallowedLinkToDisallowedFile);
}

testFeature({
	methods: [
		['lstat', 'promise'],
		['lstat', 'callback'],
		['lstatSync', 'sync'],
	],
	attempts: [
		async methodProxy => {
			makeLinks();

			// sanity check - ino's should be different between files
			assert.notEqual(
				fs.lstatSync(allowedLinkToAllowedFile).ino,
				fs.lstatSync(allowedLinkToDisallowedFile).ino,
				'sanity check failed'
			);

			const ino = fs.lstatSync(allowedLinkToAllowedFile).ino;
			const result = await boxed(() => methodProxy(allowedLinkToAllowedFile));
			assert.equal(result.ino, ino, 'lstat should succeed with an allowed link to an allowed file');
		},

		async methodProxy => {
			makeLinks();
			const ino = fs.lstatSync(allowedLinkToDisallowedFile).ino;
			const result = await boxed(() => methodProxy(allowedLinkToDisallowedFile));
			assert.equal(result.ino, ino, 'lstat should succeed with an allowed link to a disallowed file');
		},

		async methodProxy => {
			makeLinks();
			const result = await boxed(() => methodProxy(disallowedLinkToAllowedFile));
			assert.equal(result, FAIL, 'lstat should fail with a disallowed link to an allowed file');
		},

		async methodProxy => {
			makeLinks();
			const result = await boxed(() => methodProxy(disallowedLinkToDisallowedFile));
			assert.equal(result, FAIL, 'lstat should fail with a disallowed link to a disallowed file');
		},
	],
});

