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

import { useState } from "react"

import Options from "~/options"
import { sendToContent } from "~utils/messaging"

function IndexPopup() {
  const [issueType, setIssueType] = useState("Bug")
  const [issueDescription, setIssueDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      })
      if (!tab?.id) throw new Error("No active tab found")
      const response = await sendToContent(tab.id, {
        type: "issue-report",
        payload: {
          issueType,
          issueDescription
        }
      })
      console.log("Content script response:", response)
      alert("Issue report sent!")
      setIssueDescription("") // clear after send
    } catch (error) {
      console.error("Failed to send message", error)
      alert("Failed to send issue report.")
    }
  }
  return (
    <div>
      <Options />
      <h1>Report an Issue</h1>
      <form name="issueForm" id="issueForm" onSubmit={handleSubmit}>
        <label>Issue Type</label>
        <br />
        <label>
          <input
            type="radio"
            id="bug"
            name="issueType"
            value="Bug"
            checked={issueType === "Bug"}
            onChange={(e) => setIssueType(e.target.value)}
          />
          Bug
        </label>
        <br />

        <label>
          <input
            type="radio"
            id="feat"
            name="issueType"
            value="Feature"
            checked={issueType === "Feature"}
            onChange={(e) => setIssueType(e.target.value)}
          />
          Feature Request
        </label>
        <br />
        <br />
        <textarea
          id="issueDescription"
          name="issueDescription"
          rows={5}
          cols={50}
          value={issueDescription}
          placeholder="A detailed description of the issue."
          onChange={(e) => setIssueDescription(e.target.value)}
        />
        <br />
        <div style={{ textAlign: "right" }}>
          <button type="submit" id="submitIssue">
            Submit Report
          </button>
        </div>
      </form>
    </div>
  )
}

export default IndexPopup
