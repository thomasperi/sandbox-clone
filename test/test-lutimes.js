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

// The utimes methods expect atime and mtime to be in seconds,
// but the stat methods return it in milliseconds.
const atimeMs = 2000;
const mtimeMs = 1000;
const atime = atimeMs / 1000;
const mtime = mtimeMs / 1000;

testFeature({
	methods: [
		['lutimes', 'promise'],
		['lutimes', 'callback'],
		['lutimesSync', 'sync'],
	],
	attempts: [
		async methodProxy => {
			makeLinks();
			
			const result = await boxed(() => methodProxy(allowedLinkToAllowedFile, atime, mtime));
			assert.equal(result, undefined, 'lutimes should succeed with an allowed link to an allowed file');

			const stat = fs.lstatSync(allowedLinkToAllowedFile);
			assert.equal(stat.atimeMs, atimeMs, 'atime should have been changed');
			assert.equal(stat.mtimeMs, mtimeMs, 'mtime should have been changed');
		},

		async methodProxy => {
			makeLinks();
			
			const result = await boxed(() => methodProxy(allowedLinkToDisallowedFile, atime, mtime));
			assert.equal(result, undefined, 'lutimes should succeed with an allowed link to a disallowed file');

			const stat = fs.lstatSync(allowedLinkToDisallowedFile);
			assert.equal(stat.atimeMs, atimeMs, 'atime should have been changed');
			assert.equal(stat.mtimeMs, mtimeMs, 'mtime should have been changed');
		},

		async methodProxy => {
			makeLinks();
			
			const oldStat = fs.lstatSync(disallowedLinkToAllowedFile);
			const result = await boxed(() => methodProxy(disallowedLinkToAllowedFile, atime, mtime));
			assert.equal(result, FAIL, 'lutimes should fail with a disallowed link to an allowed file');

			const stat = fs.lstatSync(disallowedLinkToAllowedFile);
			assert.equal(stat.atimeMs, oldStat.atimeMs, 'atime should not have been changed');
			assert.equal(stat.mtimeMs, oldStat.mtimeMs, 'mtime should not have been changed');
		},

		async methodProxy => {
			makeLinks();

			const oldStat = fs.lstatSync(disallowedLinkToDisallowedFile);
			const result = await boxed(() => methodProxy(disallowedLinkToDisallowedFile, atime, mtime));
			assert.equal(result, FAIL, 'lutimes should fail with a disallowed link to a disallowed file');

			const stat = fs.lstatSync(disallowedLinkToDisallowedFile);
			assert.equal(stat.atimeMs, oldStat.atimeMs, 'atime should not have been changed');
			assert.equal(stat.mtimeMs, oldStat.mtimeMs, 'mtime should not have been changed');
		},
	],
});

