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

import { useEffect, useState } from "react"

import {
  getStoredOptions,
  setStoredOptions,
  type StoredOptions
} from "~/utils/storage"

function Logging() {
  const [loggingUrl, setLoggingUrl] = useState("")
  const [allowList, setAllowList] = useState("")
  const [exporterType, setExporterType] =
    useState<StoredOptions["exporterType"]>("http-json")

  useEffect(() => {
    getStoredOptions().then((data) => {
      setLoggingUrl(data.loggingUrl)
      setAllowList(data.allowList)
      setExporterType(data.exporterType)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const resp = await setStoredOptions({
      loggingUrl,
      allowList,
      exporterType
    })
    alert(resp)
  }

  return (
    <div>
      <h2>Logging Options</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="logging-url">Logging Endpoint URL:</label>
        <input
          id="logging-url"
          value={loggingUrl}
          onChange={(e) => setLoggingUrl(e.target.value)}
        />
        <br />

        <label htmlFor="exporter-type">Exporter Format:</label>
        <select
          id="exporter-type"
          value={exporterType}
          onChange={(e) =>
            setExporterType(e.target.value as StoredOptions["exporterType"])
          }>
          <option value="http-json">UserALE JSON (Default)</option>
          <option value="otlp">OpenTelemetry (OTLP/JSON)</option>
          <option value="proto-json">Protobuf v1 JSON</option>
        </select>
        <br />

        <label htmlFor="allowlist">URL allowlist regex:</label>
        <input
          id="allowlist"
          value={allowList}
          onChange={(e) => setAllowList(e.target.value)}
        />
        <br />

        <div style={{ textAlign: "right" }}>
          <button type="submit">Save Changes</button>
        </div>
      </form>
    </div>
  )
}

export default Logging
