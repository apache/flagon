---
title: Getting Started
component: useralejs
permalink: /docs/useralejs/
priority: 0
---

[Apache UserALE.js](https://github.com/apache/incubator-flagon-useralejs) is the UserALE client for DOM and JavaScript-based applications.  It automatically attaches event handlers, is configurable through HTML5 data parameters or a JS API, and logs every user interaction on a web page, including rich JS single-page apps. You can choose to include UserALE.js directly in your project to track how users engage with it, or if you're interested in generating logs from any webpage, you can try out our web extension that injects UserALE.js into every webpage.

*Note:* Work on UserALE.js' documentation is ongoing.  Contributions are welcome. To get involved, see our [Contributing]({{ '/docs/contributing' | prepend: site.baseurl }}) guide.  
### Include UserALE.js in your project

To start logging with Apache UserALE.js, you can include our script directly in your project. More details can be found in our [README](https://github.com/apache/incubator-flagon-useralejs/blob/master/README.md).

To include UserALE.js in a specific project, you'll need to deploy a version of our minified UserALE.js script in an accessible location (e.g., webserver), and simply include this script tag on the page:

```html
<script src="/path/to/userale-1.0.0.min.js"></script>
```

This tag will execute the UserALE.js script in your, with no other modifications to your project needed!

**Configure UserALE.js through the Script Tag** 

UserALE.js is designed to be easily configured to fit your use case. We use HTML data parameters to pass configuration options to the library. For example, one thing you'll need to do is set the URL (location) of your minified UserALE.js script:

```html
<script src="/path/to/userale-1.0.0.min.js" data-url="http://yourLoggingUrl"></script>
```

The complete list of configurable options is:

| Param | Description | Default |
|---|---|---|
| data-url | Logging URL | http://localhost:8000 |
| data-autostart | Should UserALE.js start on page load | true |
| data-interval | Delay between transmit checks | 5000 (ms) |
| data-threshold | Minimum number of logs to send | 5 |
| data-user | User identifier | null |
| data-version | Application version identifier | null |
| data-log-details | Toggle detailed logs (keys pressed and input/change values) | false |
| data-resolution | Delay between instances of high frequency logs (mouseover, scroll, etc.) | 500 (ms) |
| data-user-from-params | Query param in the page URL to fetch userId from | null |
| data-tool | Name of tool being logged | null |

See our page on [Build and Test]({{ '/docs/useralejs/build' | prepend: site.baseurl }}) for UserALE.js to learn how to build your own minified version of the UserALE.js script, or you check-out a pre-built script with default parameters in our [repo](https://github.com/apache/incubator-flagon-useralejs/tree/master/build).
### Deploying the UserALE.js WebExtension

If you're interested in using our Web Extension to log user activity across all pages they visit, try our web extension, which injects UserALE.js into any web page your client(s) navigate to. This option is perfect for testing and research. The web extension builds through the same [build pipeline]({{ '/docs/useralejs/build' | prepend: site.baseurl }}) as UserALE.js. You can also use pre-built extension files in our [repo](https://github.com/apache/incubator-flagon-useralejs/tree/FLAGON-336/build). 

When you're ready to deploy the UserALE.js web extension, follow the instructions below:

1. Load the web extension into your browser.
    1. Firefox
        1. Open Firefox
        1. Enter about:debugging into the URL bar and press enter
        1. Check the box to 'Enable add-on debugging'
        1. Press the 'Load Temporary Add-on' button
        1. Navigate to the root of the web extension directory (e.g. 'build/UserAleWebExtension')
        1. Press Open, and confirm that 'User ALE Extension' appears in the list
        1. You may now navigate to a web page to inject the User ALE script! 
    1. Chrome
        1. Open Chrome
        1. Enter chrome://extensions into the URL bar and press enter
        1. Check the 'Developer mode' box
        1. Press the 'Load unpacked extension' button
        1. Navigate to the root of the build directory (e.g. 'build/UserAleWebExtension')
        1. Press Ok, and confirm that 'UserALE Extension' appears in the list
        1. You may now navigate to a web page to inject the User ALE script! 

You can also find more instructions in our [README](https://github.com/apache/incubator-flagon-useralejs/blob/FLAGON-336/src/UserALEWebExtension/README.md).
       
## Options

You can set options for the web extension in your browser by opening the extensions page, finding the extension, and choosing either "Preferences" for Firefox, or "Options" for Chrome.