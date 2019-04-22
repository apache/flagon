---
title: Modifying UserALE.js
component: useralejs
permalink: /docs/useralejs/modifying
priority: 11
---

# UserALE.js Example

This directory provides 
 * example usage for UserALE.js within a simple HTML Webpage,
 * how users can expect to log UserALE events, and
 * what log events looks like within a simple UserALE logging server.

## Prerequisites

Please see the [Prerequsites](https://github.com/apache/incubator-flagon-useralejs#prerequsites)

## Running the Logging Server

Ensure that you have [node.js](https://nodejs.org/) installed. Then run:

```
npm run example:watch
```

## Running the Example

Open index.html in your favorite html editor (Notepad++,Brackets,etc.). Modify the "src" line of the UserALE.js script tag so that it 
refers to the filepath of your useralejs-1.0.0.min.js script ("file:///...[your file path].../build/userale-1.0.0.min.js").

Save the index.html file, then open index.html in your browser (you can drag it directly into a tab). You will see a very simple HTML Webpage with a button labeled, "Click Me!".

When you click the button, the events will be logged to the server (in memory), and will print to your terminal. These UserALE.js logs look similar to the following:

```

[ { target: 'body',
    path: [ 'body', 'html' ],
    clientTime: 1504287557492,
    location: { x: 0, y: 0 },
    type: 'keydown',
    userAction: true,
    details: null,
    userId: 'example-user',
    toolVersion: '1.0.0',
    toolName: 'Apache UserALE.js Example',
    useraleVersion: '1.0.0' },
  { target: '#document',
    path: [ '#document' ],
    clientTime: 1504287558304,
    location: { x: 0, y: 0 },
    type: 'blur',
    userAction: true,
    details: { window: true },
    userId: 'example-user',
    toolVersion: '1.0.0',
    toolName: 'Apache UserALE.js Example',
    useraleVersion: '1.0.0' },
  { target: '#document',
    path: [ '#document' ],
    clientTime: 1504287558304,
    location: { x: 0, y: 0 },
    type: 'blur',
    userAction: true,
    details: null,
    userId: 'example-user',
    toolVersion: '1.0.0',
    toolName: 'Apache UserALE.js Example',
    useraleVersion: '1.0.0' },
 ...
]

```

## Contributing

Contributions are welcome!  Simply [submit an issue report](https://issues.apache.org/jira/browse/FLAGON) for problems you encounter or a pull request for your feature or bug fix.  The core team will review it and work with you to incorporate it into UserALE.js.