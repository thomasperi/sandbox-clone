# sandbox-write

An experimental sandbox for reducing the risk of accidentally writing out-of-scope files during testing.

* `sandbox` monkey-patches the Node.js `fs` to prevent writing outside a specified set of directories.

* `unbox` restores `fs` to its original un-sandboxed state.

* `clonebox` clones a directory into a temporary directory so that tests can manipulate the clone without modifying the original.

* `(clonebox).run` sandboxes the `clonebox` temp directory while a specified function runs, then restores the real `fs`.

* `(clonebox).snapshot` loads the current contents of the cloned directory into a JavaScript object for later analysis.

* `(clonebox).diff` finds differences between snapshots.


## `sandbox()` and `unbox()`

Prevent writing outside the specified directory or directories with `sandbox()`. Restore the un-sandboxed real `fs` methods with `unbox()`.

```javascript
const { W_OK } = fs.constants;

sandbox('/foo/bar', '/foo/sbor');

// try/catch blocks omitted for brevity and clarity
fs.accessSync('/foo/bar/zote.txt', W_OK); // succeeds
fs.accessSync('/foo/sbor/thed.txt', W_OK); // succeeds
fs.accessSync('/foo/sneg/baz.txt', W_OK); // fails
fs.accessSync('/boo/far.txt', W_OK); // fails

unbox();

fs.accessSync('/foo/sneg/baz.txt', W_OK); // succeeds now
fs.accessSync('/boo/far.txt', W_OK); // succeeds now
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

## `clonebox()`

Clones a directory for file manipulation during tests. Returns an object with methods for managing the directory.

```javascript
const box = clonebox({
  source: '/path/to/my-test'
});
```

You can omit the `source` option to create an empty directory instead of cloning one.

```javascript
const box = clonebox();
```

### `(clonebox).base()`

Gets the path of the temp directory this clonebox created:

```javascript
box.base() // -> /tmp/clonebox-49MaGJ/my-test
```

### `(clonebox).destroy()`

Deletes this clonebox's temporary directory:

```javascript
box.destroy();
```

You should use `try`...`finally` (without `catch`) to ensure that the temp directory is deleted even when the test fails.

```javascript
const box = clonebox();
// Nothing between `clonebox()` and `try`.
try {
  // Tests and assertions should go here inside the `try` block.
} finally {
  // No tests or assertions in the `finally` block.
  box.destroy();
}
// Assertions can also go after the `finally` block.
```

### `(clonebox).run(fn)`

Sandboxes the temp directory, calls the supplied `fn` function, and then restores the real un-sandboxed `fs` methods. The `fn` function can accept the path of the temp directory as its `base` argument.

```javascript
box.run(base => {
  fs.writeFileSync(path.join(base, 'foo.txt'), 'hello', 'utf8');
  fs.writeFileSync(path.join(base, '../bar.txt'), 'nope', 'utf8'); // -> error
});
```

The function's return value gets passed through as the return value of `box.run()`.

```javascript
let flavor = box.run(base => {
  // ...
  return 'pineapple';
});
```

It works with `await` / `async` too. If you use them you have to use both, like this:

```javascript
let flavor = await box.run(async base => {
  // ...
  return 'asynchronous pineapple';
});
```

### `(clonebox).snapshot()`

Reads the contents of the temp directory into a JavaScript object for analysis. The keys are the files' pathnames relative to `base`, and the values are the files' contents.

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

Limitation:
* It doesn't provide any information about directories, only the files.

### `encodings` option

The `clonebox` function accepts an `encodings` option where you can specify how various file types are loaded into its snapshots.

```javascript
const box = clonebox({
  source: '/path/to/my-test',
  encodings: {
    gif: 'base64'
  }
});
```

If you had a gif at `/tmp/clonebox-49MaGJ/my-test/images/pixel.gif`, it would appear in the snapshot as a base64-encoded string:

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

Now `diffs` holds an object with four properties -- `created`, `modified`, `removed`, and `unchanged` -- each of which holds an array of filenames (but not the files' contents).

Limitation:
* It doesn't know about renaming. The old name will be in `deleted` and the new name will be in `created`.

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

## Notes

* Several sandboxed `fs` methods are not yet tested.

* The `access` methods don't write, but they're sandboxed anyway, because the way the
methods provide information is by whether they issue errors or not. The sandboxed versions are aware of the `mode` argument and sandbox accordingly.

* The sandboxed `open` methods are unaware of the integer values for the `flags` parameter. I haven't spent the time to understand exactly which combinations would result in a file possibly being written, and so it doesn't even try. The methods *are* aware of the string values, and prevent the use of string flags that potentially write, append, etc.

* The real `lchmod` methods are only implemented on MacOS, so the sandboxed versions are untested.

* Methods that change ownership are sandboxed but untested, because they
require elevated privileges.

* Methods that expect file descriptors instead of paths can't be sandboxed.

* Methods that only read from the filesystem but don't write are not sandboxed.
