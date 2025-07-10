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

import * as userale from "flagon-userale"

import type { PlasmoMessaging } from "@plasmohq/messaging"

import { getAllowListRegExp } from "~/background/messages/config_change"

const handler: PlasmoMessaging.PortHandler = async (req, res) => {
  const log = req.body
  log.browserSessionId = browserSessionId
  const allowListRegExp = getAllowListRegExp()
  if (allowListRegExp.test(log.pageUrl)) {
    console.log(log)
    userale.log(log)
  }
}

const browserSessionId = generateSessionId()

// TODO move this to a shared utils workspace (this is from packages/flagon-userale/src/, but shouldn't be publicly exported)
function generateSessionId(): string {
  // 32 digit hex -> 128 bits of info -> 2^64 ~= 10^19 sessions needed for 50% chance of collison
  const len = 32
  const arr = new Uint8Array(len / 2)
  self.crypto.getRandomValues(arr)
  return Array.from(arr, (dec) => {
    return dec.toString(16).padStart(2, "0")
  }).join("")
}

export default handler
