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
		['readlink', 'promise'],
		['readlink', 'callback'],
		['readlinkSync', 'sync'],
	],
	attempts: [
		async methodProxy => {
			makeLinks();
			const result = await boxed(() => methodProxy(allowedLinkToAllowedFile));
			assert.equal(result, allowedFile, 'readlink should succeed with an allowed link to an allowed file');
		},

		async methodProxy => {
			makeLinks();
			const result = await boxed(() => methodProxy(allowedLinkToDisallowedFile));
			assert.equal(result, disallowedFile, 'readlink should succeed with an allowed link to a disallowed file');
		},

		async methodProxy => {
			makeLinks();
			const result = await boxed(() => methodProxy(disallowedLinkToAllowedFile));
			assert.equal(result, FAIL, 'readlink should fail with a disallowed link to an allowed file');
		},

		async methodProxy => {
			makeLinks();
			const result = await boxed(() => methodProxy(disallowedLinkToDisallowedFile));
			assert.equal(result, FAIL, 'readlink should fail with a disallowed link to a disallowed file');
		},
	],
});
