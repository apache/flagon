---
title: UserALE.js Build and Test
component: useralejs
permalink: /docs/useralejs/build/
priority: 1
---

To build [Apache UserALE.js](https://github.com/apache/flagon-useralejs/tree/master), you will need to clone our repo and install [NPM and Node.js](https://nodejs.org/) and [Go](https://go.dev/doc/install).

UserALE.js utilizes NPM for package and dependency management. Execute the following to install dependencies.
```
#install required packages
npm install

#review major dependencies
npm ls --depth=0
```

## Build

UserALE.js uses Rollup to manage build tasking. These tasks are executed through our build script; use the following to execute:

```
#Build UserALE.js
npm run build
```

## Test

UserALE.js uses Jest and Playwright to execute tests, which are integrated into our build pipeline. See ``package.json`` for full script options. 

To run tests:
```
npm run test
```
... you'll see something like:
```
...
    attachHandlers
    ✓ attaches all the event handlers without duplicates
    ✓ debounces bufferedEvents (505ms)
    defineDetails
      - configures high detail events correctly

  configure
    ✓ merges new configs into main config object
    ✓ includes a userid if present in the window.location
    getUserIdFromParams
      ✓ fetches userId from URL params
      ✓ returns null if no matching param

  getInitialSettings
    timeStampScale
      ✓ no event.timestamp
      ✓ zero
      ✓ epoch milliseconds
      ✓ epoch microseconds
      ✓ performance navigation time
    getInitialSettings
      ✓ fetches all settings from a script tag (122ms)
      ✓ grabs user id from params

  Userale API
    ✓ provides configs
    ✓ edits configs
    ✓ starts + stops (214ms)
    ✓ sends custom logs

  packageLogs
    setLogFilter
      ✓ assigns the handler to the provided value
      ✓ allows the handler to be nulled
    setLogMapper
      ✓ assigns the handler to the provided value
      ✓ allows the handler to be nulled
    packageLog
      ✓ only executes if on
      ✓ calls detailFcn with the event as an argument if provided
      ✓ packages logs
      ✓ filters logs when a handler is assigned and returns false
      ✓ assigns logs to the mapper's return value if a handler is assigned
      ✓ does not call the map handler if the log is filtered out
      ✓ does not attempt to call a non-function filter/mapper
    extractTimeFields
      ✓ returns the millisecond and microsecond portions of a timestamp
      ✓ sets micro to 0 when no decimal is present
      ✓ always returns an object
    getLocation
      ✓ returns event page location
      ✓ calculates page location if unavailable
      ✓ fails to null
    selectorizePath
      ✓ returns a new array of the same length provided
    getSelector
      ✓ builds a selector
      ✓ identifies window
      ✓ handles a non-null unknown value
    buildPath
      ✓ builds a path
      ✓ defaults to path if available

  sendLogs
    ✓ sends logs on an interval
    ✓ does not send logs if the config is off
    ✓ sends logs on page exit with navigator
    ✓ sends logs on page exit without navigator
    ✓ does not send logs on page exit if config is off


  45 passing (954ms)
  1 pending
```

Followed by e2e tests via playwright that runs in a headed browser. Note that interacting with the headed browser may contaminate test results. Unfortanutely, the browser plugin requires playwright to run with a headed browser at this time. Any failing tests will also be logged in the terminal. If there are failing tests, please consider [opening an issue in Github](https://github.com/apache/flagon-useralejs/issues).

Further instructions can be found in our [README](https://github.com/apache/flagon-useralejs/blob/master/README.md)

## Contributing

Contributions are welcome!  See the [contribution guide](https://github.com/apache/flagon-useralejs/blob/master/CONTRIBUTING.md) for more information.