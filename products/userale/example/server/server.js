/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * for additional information. The ASF licenses this file under
 * the Apache License, Version 2.0.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

const express = require("express");
const http = require("http");
const ws = require("ws");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 8000;

// --- Setup log file ---
const logDirectory = path.resolve(__dirname, "../logs");
if (!fs.existsSync(logDirectory)) fs.mkdirSync(logDirectory);

const logPath = path.join(logDirectory, `logs_${Date.now()}.json`);
const wStream = fs.createWriteStream(logPath);
wStream.write("[");
let firstLog = true;

function writeLogs(logs) {
  if (!Array.isArray(logs) || logs.length === 0) return;

  if (firstLog) {
    wStream.write("\n\t");
    firstLog = false;
  } else {
    wStream.write(",\n\t");
  }

  wStream.write(logs.map(JSON.stringify).join(",\n\t"));
}

// --- Express Middleware ---
app.use((req, res, next) => {
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Content-Length, X-Requested-With, x-api-key, traceparent, tracestate",
  });

  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.text());

app.use(
  "/build",
  express.static(path.join(__dirname, "../../packages/flagon-userale/build")),
);
app.use("/js", express.static(path.join(__dirname, "../../../../site/js")));
app.use(
  "/assets",
  express.static(path.join(__dirname, "../../../../site/assets")),
);
app.use(
  "/semantic",
  express.static(path.join(__dirname, "../../../../site/semantic")),
);
app.use("/", express.static(__dirname));

app.get("/", (req, res) => res.sendFile("index.html", { root: __dirname }));
app.get("/ws", (req, res) =>
  res.sendFile("ws-index.html", { root: __dirname }),
);
app.get("/no-logging", (req, res) =>
  res.sendFile("no-logging.html", { root: __dirname }),
);
app.get("/site-demo", (req, res) => {
  const demoPath = path.join(
    __dirname,
    "../../../../site/_includes/useralejsDemo.html",
  );
  const rawHtml = fs.readFileSync(demoPath, "utf8");
  const renderedHtml = rawHtml.replace(
    /\{%\s*if\s+include\.inverted\s*%\}[\s\S]*?\{%\s*endif\s*%\}/g,
    "",
  );
  res.type("html").send(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Flagon Website Demo Test</title>
    <link rel="stylesheet" type="text/css" href="/semantic/dist/semantic.min.css">
    <style>#map-example { min-height: 260px; width: 100%; background-color: #0f172a; }</style>
    <script src="/assets/jquery.min.js"></script>
    <script src="/semantic/dist/semantic.min.js"></script>
  </head>
  <body>${renderedHtml}</body>
</html>`);
});

app.post(["/", "/v1/logs"], (req, res) => {
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  if (
    (Array.isArray(body) && body.length === 0) ||
    (typeof body === "object" &&
      body !== null &&
      Object.keys(body).length === 0)
  ) {
    return res.sendStatus(200);
  }

  console.log("HTTP POST:", body);
  if (Array.isArray(body)) {
    writeLogs(body);
  } else if (body && Array.isArray(body.logs)) {
    writeLogs(body.logs);
  } else if (body && Array.isArray(body.resourceLogs)) {
    writeLogs([body]);
  }
  res.sendStatus(200);
});

// --- Shared HTTP + WS Server ---
const httpServer = http.createServer(app);
const wss = new ws.WebSocketServer({ noServer: true });

httpServer.on("upgrade", (req, socket, head) => {
  if (req.url === "/ws" || req.url === "/") {
    wss.handleUpgrade(req, socket, head, (wsSocket) => {
      wss.emit("connection", wsSocket, req);
    });
  } else {
    socket.destroy();
  }
});

wss.on("connection", (socket) => {
  console.log("WebSocket client connected");

  socket.on("message", (message) => {
    const raw = typeof message === "string" ? message : message.toString();
    let body;
    try {
      body = JSON.parse(raw);
    } catch (err) {
      console.warn("Invalid JSON from WebSocket:", raw);
      return;
    }

    if (
      (Array.isArray(body) && body.length === 0) ||
      (typeof body === "object" &&
        body !== null &&
        Object.keys(body).length === 0)
    ) {
      return;
    }

    console.log("WebSocket POST:", body);
    writeLogs(body);
  });

  socket.on("close", () => console.log("WebSocket client disconnected"));
});

// --- Graceful Shutdown ---
function closeLogServer() {
  console.log("Shutting down...");

  wStream.end("\n]", () => {
    httpServer.close(() => {
      console.log("HTTP server closed.");
      wss.close(() => {
        console.log("WebSocket server closed.");
        process.exit(0);
      });
    });
  });
}

process.on("SIGINT", closeLogServer);
process.on("SIGTERM", closeLogServer);
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  closeLogServer();
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  closeLogServer();
});

// --- Conditional Start ---
if (require.main === module) {
  httpServer.listen(port, () => {
    console.log(`UserAle HTTP + WebSocket server running on port ${port}`);
  });
}
