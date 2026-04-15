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

const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 8000;

app.use((req, res, next) => {
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use("/build", express.static(path.join(__dirname, "../packages/iife/build")));
app.use("/esm-build", express.static(path.join(__dirname, "../packages/core-sdk/build")));
app.use("/", express.static(__dirname));

app.get("/", (req, res) => res.sendFile("iife.html", { root: __dirname }));
app.get("/iife", (req, res) => res.sendFile("iife.html", { root: __dirname }));
app.get("/esm", (req, res) => res.sendFile("esm.html", { root: __dirname }));
app.get("/no-logging", (req, res) => res.sendFile("no-logging.html", { root: __dirname }));

function closeServer() {
  console.log("Shutting down...");
  process.exit(0);
}

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`UserALE example server running on port ${port}`);
  });
}
