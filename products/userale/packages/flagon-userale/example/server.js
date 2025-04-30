/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const express = require("express");
const w = require("ws");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const logDirectory = path.resolve(__dirname, "../logs");
const logPath = path.resolve(
  logDirectory,
  "logs_" + new Date().getTime() + ".json",
);

try {
  fs.lstatSync(logDirectory);
} catch (e) {
  fs.mkdirSync(logDirectory); // Create directory if it doesn't exist
}

const wStream = fs.createWriteStream(logPath);
wStream.on("open", function () {
  wStream.write("[");
});

let firstLog = true;

// ~~~~~~~~ Websocket Server ~~~~~~~~~~~~~~~~
const wss = new w.WebSocketServer({ port: 8001 });
wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    console.log("message type:" + typeof message);
    const body =
      typeof message === "string"
        ? JSON.parse(message)
        : JSON.parse(message.toString());

    const isEmptyArray = Array.isArray(body) && body.length === 0;
    const isEmptyObject =
      typeof body === "object" &&
      body !== null &&
      Object.keys(body).length === 0;
    if (isEmptyArray || isEmptyObject) return;

    console.log(body);

    let delimeter = ",\n\t";

    if (firstLog) {
      wStream.write("\n\t");
      firstLog = false;
    } else {
      wStream.write(delimeter);
    }

    const logLength = message.length - 1;
    body.forEach(function (log, i) {
      if (i === logLength) {
        delimeter = "";
      }

      wStream.write(JSON.stringify(log) + delimeter);
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log("UserAle Websocket server running on port 8001");
// ~~~~~~~ End Websocket Server ~~~~~~~~~~~~~~

// ~~~~~~~ Normal Server ~~~~~~~~~~~~~~~~~~~
const app = express();

app.set("port", process.env.PORT || 8000);
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With",
  );

  // intercept OPTIONS method
  if ("OPTIONS" == req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.text());
app.use("/build", express.static(path.join(__dirname, "/../build")));
app.use("/", express.static(__dirname));
app.set("view engine", "jade");
app.use("/", express.static(__dirname));

app.get("/", function (req, res) {
  res.sendFile("index.html", { root: __dirname });
});

app.get("/ws", function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With",
  );
  res.sendFile("ws-index.html", { root: __dirname });
});

app.get("/no-logging", function (req, res) {
  res.sendFile("no-logging.html", { root: __dirname });
});

app.post("/", function (req, res) {
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  const isEmptyArray = Array.isArray(body) && body.length === 0;
  const isEmptyObject =
    typeof body === "object" && body !== null && Object.keys(body).length === 0;
  if (isEmptyArray || isEmptyObject) return;

  console.log(body);

  let delimiter = ",\n\t";

  if (firstLog) {
    wStream.write("\n\t");
    firstLog = false;
  } else {
    wStream.write(delimiter);
  }

  const logLength = req.body.length - 1;
  body.forEach(function (log, i) {
    if (i === logLength) {
      delimiter = "";
    }

    wStream.write(JSON.stringify(log) + delimiter);
  });

  res.sendStatus(200);
});

app.listen(app.get("port"), function () {
  console.log("UserAle Local running on port", app.get("port"));
});

function closeLogServer() {
  wStream.end("\n]");
  process.exit();
}
// ~~~~~~~ End Normal Server ~~~~~~~~~~~~~

process.on("SIGTERM", function () {
  closeLogServer();
});
process.on("SIGINT", function () {
  closeLogServer();
});
