# sandbox-write

An experimental monkey patch for limiting write access to specified directories via the Node.js `fs` module.

Its purpose is to reduce the risk of accidentally writing out-of-scope files during testing. **It is useless as a security measure.**

## `sandbox` / `unbox`

(try/catch blocks omitted for brevity and clarity)

```javascript
const { sandbox, unbox } = require(...);
sandbox('/foo/bar', '/foo/sbor');
await fs.access('/foo/bar/zote.txt'); // succeeds
await fs.access('/foo/sbor/thed.txt'); // succeeds
await fs.access('/foo/sneg/baz.txt'); // fails
await fs.access('/boo/far.txt'); // fails
unbox(); 
await fs.access('/foo/sneg/baz.txt'); // succeeds now
await fs.access('/boo/far.txt'); // succeeds now
```

## `clonebox`

Creates a temporary directory for file manipulation during tests.

```javascript
const box = clonebox();
```

Get the path of the temp directory that was created:

```javascript
box.base() // -> /tmp/clonebox-49MaGJ/base
```

Clones the temp directory from an original instead of creating an empty one:

```javascript
const box = clonebox({
	source: '/path/to/my-test'
});
```

A cloned directory is named using the basename of the source path:

```javascript
box.base() // -> /tmp/clonebox-XyzXD2/my-test
```

`run` calls the function in `sandbox`ed mode. The `base` argument provides the same path as what box.base() returns.

```javascript
box.run(base => {
	fs.writeFileSync(path.join(base, 'foo.txt'), 'hello', 'utf8');
	fs.writeFileSync(path.join(base, '../bar.txt'), 'nope', 'utf8'); // -> error
});
```

`run` works with `await` / `async` too:

```javascript
await box.run(async base => {
	// ...
});
```



## Notes

* Several methods are yet-untested.

* The `access` methods don't write, but they're sandboxed anyway, because the way the
methods provide information is by issuing errors.

* The `open()` methods are unaware of the integer values for the `flags` parameter. I haven't spent the time to understand exactly which combinations would result in a file possibly being written, and so it doesn't even try. The methods **are** aware of the string values, and prevent the use of string flags that potentially write, append, etc.

* The `lchmod` methods are only implemented on MacOS, so are sandboxed but untested.

* Methods that change ownership are sandboxed but are untested, because they
require elevated privileges.

* Methods that expect file descriptors instead of paths can't be sandboxed.

* Methods that only read from the filesystem but don't write are not sandboxed.
