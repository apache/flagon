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
import { messageTypes } from "@/UserALEWebExtension/messageTypes";
import * as userale from "@/main";
import { rerouteLog, browser, configKey } from "@/UserALEWebExtension/globals";
import { Configuration } from "@/configure";
import { Extension } from "@/types";

userale.addCallbacks({ rerouteLog });

// TODO: Warn users when setting credentials with unsecured connection.
// const mitmWarning =
//   "Setting credentials with http will expose you to a MITM attack. Are you sure you want to continue?";

function setConfig() {
  const config = Configuration.getInstance();
  config.update({
    url: (document.getElementById("url") as HTMLInputElement).value,
    userId: (document.getElementById("user") as HTMLInputElement).value,
    toolName: (document.getElementById("tool") as HTMLInputElement).value,
    toolVersion: (document.getElementById("toolVersion") as HTMLInputElement)
      .value,
  });

  // Set a basic auth header if given credentials.
  const password = (document.getElementById("password") as HTMLInputElement)
    .value;
  if (config.userId && password) {
    config.update({
      authHeader: "Basic " + btoa(`${config.userId}:${password}`),
    });
  }

  const payload: Extension.ConfigPayload = {
    useraleConfig: config,
    pluginConfig: {
      urlWhitelist: (document.getElementById("filter") as HTMLInputElement)
        .value,
    },
  };

  userale.options(config);
  browser.runtime.sendMessage({ type: messageTypes.CONFIG_CHANGE, payload });
}

function getConfig() {
  // @ts-expect-error Typescript is not aware that firefox's broswer is overloaded
  // to support chromium style MV2 callbacks
  browser.storage.local.get([configKey], (res) => {
    const payload = res[configKey];
    const config = payload.useraleConfig;

    userale.options(config);
    (document.getElementById("url") as HTMLInputElement).value = config.url;
    (document.getElementById("user") as HTMLInputElement).value =
      config.userId as string;
    (document.getElementById("tool") as HTMLInputElement).value =
      config.toolName as string;
    (document.getElementById("toolVersion") as HTMLInputElement).value =
      config.toolVersion as string;
    (document.getElementById("filter") as HTMLInputElement).value =
      payload.pluginConfig.urlWhitelist;
  });

  (document.getElementById("optionsForm") as HTMLFormElement).addEventListener(
    "submit",
    setConfig,
  );
  const issueForm = document.getElementById("issueForm");
  if (issueForm instanceof HTMLElement) {
    issueForm.addEventListener("submit", reportIssue);
  }
}

function reportIssue() {
  browser.runtime.sendMessage({
    type: messageTypes.ISSUE_REPORT,
    payload: {
      details: {
        issueType: (
          document.querySelector(
            'input[name="issueType"]:checked',
          ) as HTMLButtonElement
        ).value,
        issueDescription: (
          document.getElementById("issueDescription") as HTMLTextAreaElement
        ).value,
      },
      type: "issue",
    },
  });
}

document.addEventListener("DOMContentLoaded", getConfig);

browser.runtime.onMessage.addListener(function (message, sender) {
  if (message.type === messageTypes.ISSUE_REPORT) {
    if (window.top === window) {
      userale.packageCustomLog(
        message.payload,
        () => {
          return {};
        },
        true,
      );
    }
  }
});
