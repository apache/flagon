---
title: Contributing
component: useralejs
priority: 11
---

### Building UserALE.js

To modify and build your own version of UserAle.js, first clone the repo, install dependencies, and make any desired changes. Then build and minify into the build/ folder:

  ```shell
  git clone https://github.com/apache/incubator-senssoft-useralejs.git
  npm install
  npm run build
  ```

### Testing and Linting

We maintain code quality through linting and our test suite.  To run, or run and watch for changes:

  ```shell
  npm test
  npm run test:watch
  ```

See package.json for full script options.
