# sandbox-clone

An experimental sandbox for reducing the risk of accidentally writing or deleting out-of-scope files during testing.

```
npm i -D sandbox-clone
```

```javascript
const { sandbox, unbox, isBoxed, Clone } = require('sandbox-clone');
```

* `sandbox()` monkey-patches the built-in Node.js `fs` module to limit writing outside a specified set of directories.

* `unbox()` restores original un-sandboxed state.

* `isBoxed()` reports whether `fs` is sandboxed or not.

* `new Clone()` clones a directory into a temporary directory so that tests can manipulate the clone without modifying the original. Returns an object with these methods:

	* `.base()` returns the path of the temporary directory.

  * `.destroy()` deletes the temporary directory.

  * `.run()` sandboxes the temp directory while a specified function runs, then restores the real `fs`.

  * `.snapshot()` loads the current contents of the cloned directory into a JavaScript object for later analysis.

  * `.diff()` finds differences between snapshots.


## `sandbox()` and `unbox()`

Prevent writing outside the specified directory (or directories) with `sandbox()`. Restore the un-sandboxed real `fs` methods with `unbox()`.

```javascript
const { W_OK } = fs.constants;

sandbox('/foo/bar');

// try/catch blocks omitted for brevity and clarity
fs.accessSync('/foo/bar/zote.txt', W_OK); // succeeds
fs.accessSync('/foo/bar/thed.txt', W_OK); // succeeds
fs.accessSync('/foo/sneg/baz.txt', W_OK); // fails
fs.accessSync('/boo/far.txt', W_OK); // fails

unbox();

fs.accessSync('/foo/sneg/baz.txt', W_OK); // succeeds now
fs.accessSync('/boo/far.txt', W_OK); // succeeds now
```

### Variations

Multiple sandbox directories:
```javascript
sandbox('/foo/bar', '/foo/sbor');
```

Relative paths:
```javascript
process.chdir('/foo');
sandbox('bar');
```

If no arguments, the working directory is used:
```javascript
process.chdir('/foo/bar');
sandbox();
```

### `isBoxed()`

Reports whether sandboxing is in effect.

```javascript
console.log(isBoxed()); // -> false
sandbox('/foo/bar');
console.log(isBoxed()); // -> true
unbox();
console.log(isBoxed()); // -> false
```

### Notes about the sandboxed `fs` methods:

- Methods that expect file descriptors instead of paths can't be sandboxed.

- Methods that only read from the filesystem but don't write aren't sandboxed.

  - Exception: The `access` methods don't write to the filesystem, but are sandboxed anyway, because the way they work is by either issuing an error or not. Therefore the sandboxed versions are aware of the `mode` argument and only reject on `fs.constants.W_OK`.

- The sandboxed `open` methods are unaware of the integer values for the `flags` parameter. They *are* aware of the string values (`'a'`, `'a+'`, `'as'`, etc.) however, and reject the ones that allow writing.

- The real `lchmod` methods are only implemented on MacOS, so the sandboxed versions are untested.

- The real `chown` methods require elevated privileges, so the sandboxed versions are untested.


## `new Clone()`

Clones a directory for file manipulation during tests. Returns an object with methods for managing the directory.

```javascript
const clone = new Clone({
  source: '/path/to/my-test'
});
```

### `.base()`

The `base()` method returns the path of the temporary clone. The directory will have the same basename as the original (`my-test` in this example).

```javascript
console.log(clone.base()); // -> "/tmp/clone-49MaGJ/my-test"
```

If you omit the `source` option, an empty directory is created instead of an existing one being cloned. The temporary path will end with the name `base`.

```javascript
const clone = new Clone(); // No `source` option
console.log(clone.base()); // -> "/tmp/clone-We2MRT/base"
```

### `.destroy()`

Deletes this `Clone`'s temporary directory:

```javascript
clone.destroy();
```

You should use `try`...`finally` (without `catch`) to ensure that the temp directory is deleted even when the test fails.

```javascript
const clone = new Clone();
// Nothing between here and `try`.
try {
  // Tests and assertions should go here inside the `try` block.
} finally {
  // No tests or assertions in the `finally` block.
  clone.destroy();
}
// Assertions can also go after the `finally` block.
```

### `.run(fn)`

Sandboxes the temp directory, calls the supplied `fn` function, and then restores the real un-sandboxed `fs` methods. The `fn` function can accept the path of the temp directory as its `base` argument.

```javascript
clone.run(base => {
  fs.writeFileSync(path.join(base, 'foo.txt'), 'hello', 'utf8');
  fs.writeFileSync(path.join(base, '../bar.txt'), 'nope', 'utf8'); // Fails
});
```

The function's return value gets passed through as the return value of `clone.run()`.

```javascript
let flavor = clone.run(base => {
  // ...
  return 'pineapple';
});
```

It works with `await` / `async` too.

```javascript
let flavor = await clone.run(async base => {
  // ...
  return 'asynchronous pineapple';
});
```

### `.snapshot()`

Reads the contents of the temp directory into a JavaScript object for analysis. The keys are the files' pathnames relative to `base`, and the values are the files' contents. It doesn't provide any information about directories, only the files.

With the following files...

```
/tmp/clone-49MaGJ/my-test/scripts/foo.js
/tmp/clone-49MaGJ/my-test/styles/bar.css
```

...the snapshot might look like this:

```json
{
  "scripts/foo.js": "console.log('foo');",
  "styles/bar.css": ".bar { color: green }"
}
```

### `encodings` option

The `Clone` constructor accepts an `encodings` option in which you can specify how various file types are loaded into the snapshots. The default is `'utf8'`.

```javascript
const clone = new Clone({
  source: '/path/to/my-test',
  encodings: {
    gif: 'base64'
  }
});
```

If you have a gif at `/tmp/clone-49MaGJ/my-test/images/pixel.gif`, it'll be base64-encoded in the snapshot:

```json
{
  "images/pixel.gif": "R0lGODlhAQABAPAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAICTAEAOw==",
  "scripts/foo.js": "console.log('foo');",
  "styles/bar.css": ".bar { color: green }"
}
```

### `.diff()`

Reports which files were created, modified, and removed from the temp directory between snapshots.

```javascript
const clone = new Clone({
  source: '/path/to/my-test'
});
const before = clone.snapshot();
clone.run(base => {
  // create, modify, and/or remove some files
});
const after = clone.snapshot();
const diffs = clone.diff(before, after);
```

Now `diffs` holds an object with four properties -- `created`, `modified`, `removed`, and `unchanged` -- each of which holds an array of filenames (but not the files' contents).

```json
{
  "created": [
    "images/icon.png",
    "images/photo.jpg"
  ],
  "modified": [
    "styles/bar.css"
  ],
  "removed": [
    "images/pixel.gif"
  ],
  "unchanged": [
    "scripts/foo.js"
  ]
}
```

It doesn't know about renaming. The old name will be in `deleted` and the new name will be in `created`.
