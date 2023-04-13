/*global describe, it */
const os = require('os'); // eslint-disable-line no-unused-vars
const fs = require('fs'); // eslint-disable-line no-unused-vars
const path = require('path'); // eslint-disable-line no-unused-vars
const assert = require('assert'); // eslint-disable-line no-unused-vars
const { sandbox, unbox, isBoxed } = require('..'); // eslint-disable-line no-unused-vars

const sandboxDir = path.join(__dirname, 'test-isBoxed');

describe('clonebox tests', async () => {

	it('should correctly report whether the sandbox is in effect', async () => {
		assert(!isBoxed());
		sandbox(sandboxDir);
		assert(isBoxed());
		unbox();
		assert(!isBoxed());
	});

});

