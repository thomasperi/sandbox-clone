# sandbox-write

An experimental filesystem sandbox for reducing the risk of accidentally writing out-of-scope files during testing.

* `sandbox` monkey-patches the Node.js `fs` to prevent writing outside a specified set of directories.

* `unbox` restores `fs` to its original un-sandboxed state.

* `clonebox` clones a directory into a temporary directory so that tests can manipulate the clone without modifying the original.

* `(clonebox).run` sandboxes the `clonebox` temp directory while a specified function runs, then restores the real `fs`.

* `(clonebox).snapshot` loads the contents of the cloned directory into a JavaScript object for analysis.

* `(clonebox).diff` finds differences between snapshots.


## `sandbox()` / `unbox()`

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

## `clonebox()`

Clone a directory for file manipulation during tests:

```javascript
const box = clonebox({
  source: '/path/to/my-test'
});
```

Create an empty temp directory by not specifying a source:

```javascript
const box = clonebox();
```

### `(clonebox).base()`

Get the path of the temp directory that was created:

```javascript
box.base() // -> /tmp/clonebox-49MaGJ/my-test
```

### `(clonebox).destroy()`

Delete the temporary directory:

```javascript
box.destroy();
```

### `(clonebox).run(fn)`

Sandboxes the temp directory, calls the supplied `fn` function, and then restores the real un-sandboxed `fs` methods. `fn` can accept the path of the temp directory as its `base` argument.

```javascript
box.run(base => {
  fs.writeFileSync(path.join(base, 'foo.txt'), 'hello', 'utf8');
  fs.writeFileSync(path.join(base, '../bar.txt'), 'nope', 'utf8'); // -> error
});
```

It works with `await` / `async` too:

```javascript
await box.run(async base => {
  // ...
});
```

### `(clonebox).snapshot()`

Loads the contents of the temp directory into a JavaScript object for analysis. The keys are the files' pathnames relative to `base`, and the values are the files' contents.

Supposing you had the following files:

```
/tmp/clonebox-49MaGJ/my-test/scripts/foo.js
/tmp/clonebox-49MaGJ/my-test/styles/bar.css
```

The snapshot might look like this:

```json
{
  "scripts/foo.js": "console.log('foo');",
  "styles/bar.css": ".bar { color: green }"
}
```

### `encodings` option

The `clonebox` function accepts an `encodings` option where you can specify how various file types are read into the snapshot.

```javascript
const box = clonebox({
  source: '/path/to/my-test',
  encodings: {
  	gif: 'base64'
  }
});
```

So if you had a gif at `/tmp/clonebox-49MaGJ/my-test/images/pixel.gif`, it would appear in the snapshot as a base64-encoded string:

```json
{
  "images/pixel.gif": "R0lGODlhAQABAPAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAICTAEAOw==",
  "scripts/foo.js": "console.log('foo');",
  "styles/bar.css": ".bar { color: green }"
}
```

### `(clonebox).diff()`

Reports which files were created, modified, and removed from the temp directory between snapshots.

```javascript
const box = clonebox({
  source: '/path/to/my-test'
});
const before = box.snapshot();
box.run(base => {
  // create, modify, and/or remove some files
});
const after = box.snapshot();
const diffs = box.diff(before, after);
```

`diffs` now holds an object with three properties `created`, `modified`, and `removed`, each of which holds an array of filenames (but not the files' contents).

```json
{
  "created": [
    "images/photo.jpg",
    "images/icon.png"
  ],
  "modified": [
  	"scripts/bundle.js"
  ],
  "removed": [
		"scripts/foo.js",
		"styles/bar.css"
  ]
}
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
