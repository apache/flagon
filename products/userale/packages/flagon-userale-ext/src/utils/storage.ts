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

import browser from "webextension-polyfill"

import { sendToBackground } from "@plasmohq/messaging"

export const STORAGE_KEYS = {
  accessToken: "accessToken",
  allowList: "allowList",
  loggingUrl: "loggingUrl"
} as const

export type StorageKeys = keyof typeof STORAGE_KEYS

export type StoredOptions = {
  accessToken: string
  allowList: string
  loggingUrl: string
}

const DEFAULT_OPTIONS: StoredOptions = {
  accessToken: "",
  allowList: "https://flagon.apache.org/",
  loggingUrl: "http://localhost:8000"
}

export async function getStoredOptions(): Promise<StoredOptions> {
  const stored: Partial<StoredOptions> = await browser.storage.local.get(
    Object.keys(DEFAULT_OPTIONS)
  )

  return {
    accessToken: stored.accessToken ?? DEFAULT_OPTIONS.accessToken,
    allowList: stored.allowList ?? DEFAULT_OPTIONS.allowList,
    loggingUrl: stored.loggingUrl ?? DEFAULT_OPTIONS.loggingUrl
  }
}

// Only to be used in ~/options
export async function setStoredOptions(values: Partial<StoredOptions>) {
  // Validate the new options
  try {
    new RegExp(values.allowList)
    new URL(values.loggingUrl)
  } catch (error) {
    return error
  }

  // Store the options for after the browser is closed
  await browser.storage.local.set(values)

  // Notify the background script of the change
  return await sendToBackground({
    name: "config_change",
    body: values
  })
}
