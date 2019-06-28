---
title: Modifying
component: useralejs
priority: 3
---

# Customizing UserALE.js Logs through Source Code Modifications

[Apache UserALE.js](https://github.com/apache/incubator-flagon-useralejs) makes it easy for you to capture *every* user 
behavior on your webpage or application. But, you might not need all that data and you might not care to worry about 
scaling your logging data store. Fortunately, UserALE.js also makes it easy for your to manage, and curate your 
logging scheme. 

This guide walks you through how to modify UserALE.js log data and behavior through source code modification.

## Modifying UserALE.js Logs via Source Code Modifications

We're starting with this method because it will give context to others methods, like our script tag and API (below).

UserALE.js src is intuitively abstracted into few different files"

 * [attachHandlers](https://github.com/apache/incubator-flagon-useralejs/blob/master/src/attachHandlers.js): configure which user behaviors UserALE.js listens for and event handlers here.
 * [configure](https://github.com/apache/incubator-flagon-useralejs/blob/master/src/configure.js): set special custom parameters, like passing a unqiue userID into UserALE.js logs.
 * [getInitialSettings](https://github.com/apache/incubator-flagon-useralejs/blob/master/src/getInitialSettings.js): modify HTML5 parameters passed through the script tag.
 * [main](https://github.com/apache/incubator-flagon-useralejs/blob/master/src/main.js): attaches event handlers and adds logs to queue (probably want to leave alone).
 * [packageLogs](https://github.com/apache/incubator-flagon-useralejs/blob/master/src/packageLogs.js): modify to configure how user behaviors are added to data schema, and meta data added from the page.
 * [sendLogs](https://github.com/apache/incubator-flagon-useralejs/blob/master/src/sendLogs.js): modify how logs are sent to logging server, etc. (be careful here, too).

###Usage
 
Most modifications can be accomplished through `attachHandlers` and `packageLogs`.

Once you modify source, you'll need to rebuild UserALE.js scripts and webextension (and should probably run unit tests).

###Modifying Event Handlers: Examples

`attachHandlers` controls which behaviors and what kinds of logs are captured

You can modify some of the events UserALE.js by editing vars in `attacheHandlers`.


```javascript
you can modify the events UserALE.js by editing vars in `attacheHandlers`
var events;
var bufferBools;
var bufferedEvents;
/* modify which events are abstracted into interval logs by editing the array below*/
var intervalEvents = ['click', 'focus', 'blur', 'input', 'change', 'mouseover', 'submit'];
/* modify which events are pulled from window*/
var windowEvents = ['load', 'blur', 'focus'];
```

You can modify which events UserALE.js captures in it's 'raw' log stream, by modifying the var `events`:

 
```javascript
/* Comment out event types in the `events` var for granular modification of UserALE.js behavior */
export function defineDetails(config) {
  // Events list
  // Keys are event types
  // Values are functions that return details object if applicable
  events = {
    'click' : extractMouseEvent,
    'dblclick' : extractMouseEvent,
    'mousedown' : extractMouseEvent,
    'mouseup' : extractMouseEvent,
    'focus' : null,
    'blur' : null,
    'input' : config.logDetails ? function(e) { return { 'value' : e.target.value }; } : null,
    'change' : config.logDetails ? function(e) { return { 'value' : e.target.value }; } : null,
    'dragstart' : null,
    'dragend' : null,
    'drag' : null,
    'drop' : null,
    'keydown' : config.logDetails ? function(e) { return { 'key' : e.keyCode, 'ctrl' : e.ctrlKey, 'alt' : e.altKey, 
        'shift' : e.shiftKey, 'meta' : e.metaKey }; } : null,
    /*'mouseover' : null,*/ #Aliasing out events from the "events" list removes that class from your event stream.
    'submit' : null
```

You can eliminate the `interval` log stream altogether by modifying the `attachHandlers` configs:


```javascript
export function attachHandlers(config) {
  defineDetails(config);

  Object.keys(events).forEach(function(ev) {
    document.addEventListener(ev, function(e) {
      packageLog(e, events[ev]);
    }, true);
  });
/*Comment out configs for intervalEvents to remove them from your log stream */
  intervalEvents.forEach(function(ev) {
    document.addEventListener(ev, function(e) {
        packageIntervalLog(e);
    }, true);
  });
```
###Modifying Meta Data Packaged in Logs: Examples

`packageLogs` pulls parameters from the script tag, API, and from window or document and adds them to event logs.

The easiest way to make these changes is by modifying the var `log`:


```javascript
  /* Comment or add fields to be included in your logs, pulling in other data from configs, window, or documents */
  var log = {
    'target' : getSelector(e.target),
    'path' : buildPath(e),
    'pageUrl': window.location.href,
    'pageTitle': document.title,
    'pageReferrer': document.referrer,
    'clientTime' : timeFields.milli,
    'microTime' : timeFields.micro,
    'location' : getLocation(e),
    'type' : e.type,
    'logType': 'raw',
    'userAction' : true,
    'details' : details,
    'userId' : config.userId,
    'toolVersion' : config.version,
    'toolName' : config.toolName,
    'useraleVersion': config.useraleVersion,
    'sessionID': config.sessionID
  };
```

### Benefits Modifying UserALE.js Logs via src:
 * Full control of your log streams
 * With simple modification to src you can package and build multiple UserALE.js scripts for page-to-page modification 
 of log streams.
 * Modify the behavior of our webExtension
 * Ideal in cases where you don't want to integrate UserALE.js into your CD pipeline, just pass around pre-built scripts 
 that suite your needs.

## Contributing

Contributions are welcome!  Simply [submit an issue report](https://issues.apache.org/jira/browse/FLAGON) for problems 
you encounter or a pull request for your feature or bug fix.  The core team will review it and work with you to 
incorporate it into UserALE.js.