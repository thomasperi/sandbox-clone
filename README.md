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

## `clone`

Create a temporary clone of a directory of test files:



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
