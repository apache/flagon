import Auth from "~/options/auth"
import Logging from "~/options/logging"

function Options() {
  return (
    <div>
      <h1>Extension Options</h1>
      <Auth />
      <Logging />
    </div>
  )
}

export default Options
