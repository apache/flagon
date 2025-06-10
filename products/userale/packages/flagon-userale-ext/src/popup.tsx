import { useState } from "react"

import Options from "~/options"

function IndexPopup() {
  const [issueType, setIssueType] = useState("Bug")
  const [issueDescription, setIssueDescription] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO add messaging
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
