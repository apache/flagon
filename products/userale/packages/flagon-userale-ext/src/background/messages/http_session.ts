// This is a bit complicated, but once tab logs are added in main. You can create a mapping of tab ids (a browser construct) to http session ids (a userale construct).
// The content script should send a message containing its http session id, and it should be added to the mapping here, then use the mapping in background/index.ts to set the http session field of tab logs.
// This is also the least import part, so save it for last.
