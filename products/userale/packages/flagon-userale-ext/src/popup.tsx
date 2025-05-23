import { useState } from "react";
import Options from "~/options";
import { sendToContent } from "~utils/messaging"

function IndexPopup() {
  const [issueType, setIssueType] = useState("Bug");
  const [issueDescription, setIssueDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error("No active tab found");
      const response = await sendToContent(tab.id, {
        type: "issue-report",
        payload: {
          issueType,
          issueDescription
        }
      });
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
  );
}

export default IndexPopup;
