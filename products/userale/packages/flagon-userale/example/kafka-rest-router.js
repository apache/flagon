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

const commander = require("commander");
const { program } = require("commander");
const express = require("express");
const bodyParser = require("body-parser");

// Functions.
const myParseInt = (value, _dummyPrevious) => {
  // parseInt takes a string and a radix
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new commander.InvalidArgumentError("Not a number.");
  }
  return parsedValue;
};

const configureCors = (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST,OPTIONS");
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
};

const transformAndForward = async (req, res) => {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    // Sometimes UserALE sends empty buffers or empty objects, these need to be filtered out
    const isEmptyArray = Array.isArray(body) && body.length === 0;
    const isEmptyObject =
      typeof body === "object" &&
      body !== null &&
      Object.keys(body).length === 0;
    if (isEmptyArray || isEmptyObject) return;

    if (options.verbose) console.log(JSON.stringify(body, null, 3));

    const transformedPayload = {
      records: body.map((log) => ({
        key: log["sessionId"],
        value: log,
      })),
    };

    if (options.verbose)
      console.log(JSON.stringify(transformedPayload, null, 3));

    const response = await fetch(options.forwardTo, {
      method: "POST",
      body: JSON.stringify(transformedPayload),
      headers: { "Content-Type": "application/json" },
    });

    const statusCode = response.status;

    res.status(statusCode).send(`Forwarded status code: ${statusCode}`);
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).send("Internal service error");
  }
};

const gracefulShutdown = () => {
  process.exit();
};

// Args
program
  .requiredOption("-f, --forward-to <forward-address>", "Forwarding address")
  .option("-p, --port <port>", "Port number", myParseInt, 8000)
  .option("-v, --verbose", "Enable verbose mode", false)
  .parse(process.argv);
const options = program.opts();
console.log(options);

// Configure app
const app = express();

app.set("port", options.port);
app.use(configureCors);
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.text());

// Routes
app.post("/", transformAndForward);

// Server
app.listen(app.get("port"), () => {
  console.log(
    "UserALE Karapace Router started...",
    `\n\tPort: ${app.get("port")}`,
    `\n\tForwarding address: ${options.forwardTo}`,
    `\n\tVerbose: ${options.verbose}`,
  );
});

process.on("SIGTERM", () => gracefulShutdown());
process.on("SIGINT", () => gracefulShutdown());
