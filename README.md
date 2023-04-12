# Sandbox FS

An experimental `fs` monkey patch for limiting write access to certain directories.

Its purpose is to reduce the risk of accidental destruction while testing. **It is not intended to be a security feature,** so please don't try to use it that way.

```javascript
// try/catch blocks omitted for brevity
const unbox = sandboxFs('/foo/bar', '/foo/sbor');
await fs.access('/foo/bar/zote.txt'); // succeeds
await fs.access('/foo/sbor/thed.txt'); // succeeds
await fs.access('/foo/sneg/baz.txt'); // fails
await fs.access('/boo/far.txt'); // fails
unbox(); 
await fs.access('/foo/sneg/baz.txt'); // succeeds now
await fs.access('/boo/far.txt'); // succeeds now
```

## Notes

* The `open()` methods are unaware of the integer values for the `flags` parameter. I haven't spent the time to understand exactly which combinations would result in a file possibly being written, and so it doesn't even try. The methods **are** aware of the string values, and prevent the use of string flags that potentially write, append, etc.
