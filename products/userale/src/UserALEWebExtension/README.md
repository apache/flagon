<!--
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
-->

# UserALE Web Extension

The UserALE Web Extension is designed to enable user activity logging across any page they visit, regardless of domain. To achieve this, we repackaged our UserALE library into a WebExtension compliant format to allow portability between browsers.

## Folder/file structure

Here is a rundown of the UserALE Extension hierarchy.

- ../
  - The parent directory should be the src for the core of UserALE
- README.md
  - You're looking at me!
- icons/
  - Used by the web extension to load icon resources.
- public/
  - Used for sample/test webpages and resources. Not actually part of the Firefox plugin! Used by NPM's http-server module (and other web servers).
- globals.js
  - Holds default values for the web extension's options.
- manifest.json
  - The main web extension project file, where it all begins.
- options.js
  - JavaScript code used by the web extension's options page.
- optionsPage.html
  - HTML for the options page.
- user-ale-ext.js
  - The JavaScript code used by the web extension.

## Quick Start

1. You need to have a UserALE server running; one way is to clone the UserALE repository, run the build, and then start the included test server.
   1. git clone https://github.com/apache/incubator-flagon-useralejs.git
   1. cd incubator-flagon-useralejs
   1. npm install && npm run build
   1. npm run example:watch
   1. A UserALE logging server should now be running on http://localhost:8000
1. Load the web extension into your browser.
   1. Firefox
      1. Open Firefox
      1. Enter about:debugging into the URL bar and press enter
      1. Check the box to 'Enable add-on debugging'
      1. Press the 'Load Temporary Add-on' button
      1. Navigate to the root of the web extension directory (e.g. 'build/UserAleWebExtension')
      1. Press Open, and confirm that 'User ALE Extension' appears in the list
      1. You may now navigate to a web page to inject the User ALE script! (e.g. http://localhost:8080)
   1. Chrome
      1. Open Chrome
      1. Enter chrome://extensions into the URL bar and press enter
      1. Check the 'Developer mode' box
      1. Press the 'Load unpacked extension' button
      1. Navigate to the root of the build directory (e.g. 'build/UserAleWebExtension')
      1. Press Ok, and confirm that 'UserALE Extension' appears in the list
      1. You may now navigate to a web page to inject the User ALE script! (e.g. http://localhost:8080)

## Options

You can set options for the web extension in your browser by opening the extensions page, finding the extension, and choosing either "Preferences" for Firefox, or "Options" for Chrome.

## Updating UserALE client script

This version of the web extension has been modified to automatically reflect the correct version of the UserALE core script during the build process. You should not need to change anything for it to "just work".

However, if something appears wrong, you can look at the 'src/UserAleWebExtension/globals.js' and 'src/UserAleWebExtension/manifest.json' to see how the UserALE client script is being set. Also look at the build steps related to the web extension in 'gulpfile.js' to see how the two previously mentioned files are modified to reflect the current version of the UserALE client script.

## Gotchas

There is a known issue when attemping to gather logs from a page running on HTTPS. This occurs due to Mixed Active Content rules in the browser, since the current implementation of the Extension injects the script as HTTP. We are aware of the problem and are actively working towards a fix.

In the meantime, the only workaround is to disable the related security option in the browser:

- [Chrome](https://superuser.com/questions/487748/how-to-allow-chrome-browser-to-load-insecure-content)
- [Firefox](https://support.mozilla.org/en-US/kb/mixed-content-blocking-firefox)
