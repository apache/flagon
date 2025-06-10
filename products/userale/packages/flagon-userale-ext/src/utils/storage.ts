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
  try {
    new RegExp(values.allowList)
    new URL(values.loggingUrl)
  } catch (error) {
    return error
  }

  await browser.storage.local.set(values)
  return await sendToBackground({
    name: "config_change",
    body: { values }
  })
}
