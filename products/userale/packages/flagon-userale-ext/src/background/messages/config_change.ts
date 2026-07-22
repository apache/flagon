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

import type { StoredOptions } from "~utils/storage"

let allowListRegExp: RegExp

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  setOptions(req.body)
}

export function setOptions(options: StoredOptions) {
  userale.options({ url: options.loggingUrl })
  allowListRegExp = new RegExp(options.allowList)

  switch (options.authMode) {
    case "oauth":
      userale.options({
        authHeader: options.accessToken ? `Bearer ${options.accessToken}` : null,
        apiKey: null
      })
      break
    case "apikey":
      userale.options({
        authHeader: null,
        apiKey: options.apiKey || null
      })
      break
    default:
      userale.options({ authHeader: null, apiKey: null })
  }
}

export function getAllowListRegExp() {
  return allowListRegExp
}

export default handler
