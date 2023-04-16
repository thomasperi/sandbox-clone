# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]

### Added

- (dev) Tests now use a standard set of symlinks and unique temp directories.
- (dev) Tests for more methods.
- Relative and unspecified sandbox paths now resolve to working directory.

### Fixed

- Some examples in README.md used an outdated naming convention.
- (dev) Some Clone tests were too permissive.
- Bugfix to how paths are verified with realpath.
- The sandboxed methods themselves now check whether there are any sandbox directories set before enforcing the path restrictions. Not doing so was causing `cp` methods to misbehave, because `cp` apparently keeps references to the fs methods however it first finds them.
- More sandboxed methods now correctly don't dereference symlinks.


## [1.0.1] - 2023-04-14

### Fixed

- Fixed package.json `files` property.


## [1.0.0] - 2023-04-14

[unreleased]: https://github.com/thomasperi/sandbox-clone/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/thomasperi/sandbox-clone/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/thomasperi/sandbox-clone/releases/tag/v1.0.0
