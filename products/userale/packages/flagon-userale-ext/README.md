<!--
  Licensed to the Apache Software Foundation (ASF) under one
  or more contributor license agreements. See the NOTICE file
  distributed with this work for additional information
  regarding copyright ownership. The ASF licenses this file
  to you under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing,
  software distributed under the License is distributed on an
  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
  either express or implied. See the License for the specific
  language governing permissions and limitations under the License.
-->

# Flagon UserALE Browser Extension

This package provides a browser extension for [Flagon UserALE](https://flagon.apache.org/userale/), enabling effortless, no-code instrumentation of websites. It captures user interactions and sends behavioral logs to a logging endpoint.

The extension is built with [Plasmo](https://docs.plasmo.com/) and supports modern browser environments like Chrome and Firefox.

---

## Features

✅ Passive user interaction logging  
✅ No code changes required on instrumented pages  
✅ Configurable via extension options (logging endpoint, user ID, tool metadata)  
✅ Supports local development and custom deployments

---

## Getting Started (Development)

1. Install dependencies:

```bash
pnpm install
```

2. Start the development build:

```bash
pnpm dev
```

3. Load the extension in your browser:
   - **Chrome**: Visit `chrome://extensions/`, enable Developer Mode, click "Load unpacked", and select the `build/chrome-mv3-dev/` directory.
   - **Firefox**: Visit `about:debugging`, "This Firefox", "Load Temporary Add-on", and select the `manifest.json` file in `build/firefox-mv3-dev/`.

---

## Building for Production

To create a production build:

```bash
pnpm build
```

This outputs a zipped production bundle.

---

## Extension Options

After installing the extension, click the icon in your browser toolbar to open the **Options** page. From here you can configure:
- **Logging Endpoint** – Where logs will be sent
- **URL allowlist** – A regex of URL's to allow logging on
- **OAuth Credentials** – Details of an OAuth login to authenticate with the logging endpoint.

---

## Resources

- 📚 [UserALE Documentation](https://flagon.apache.org/userale/)

