import { useEffect, useState } from "react"

import { getStoredOptions, setStoredOptions } from "~/utils/storage"

function Logging() {
  const [loggingUrl, setLoggingUrl] = useState("")
  const [allowList, setAllowList] = useState("")

  useEffect(() => {
    getStoredOptions().then((data) => {
      setLoggingUrl(data.loggingUrl)
      setAllowList(data.allowList)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const resp = await setStoredOptions({ loggingUrl, allowList })
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
