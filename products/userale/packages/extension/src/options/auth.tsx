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

import pkceChallenge from "pkce-challenge"
import { useState } from "react"
import browser from "webextension-polyfill"

import { setStoredOptions } from "~/utils/storage"

function Auth() {
  const [issuerUrl, setIssuerUrl] = useState("")
  const [clientId, setClientId] = useState("")
  const [message, setMessage] = useState("")

  const handleLogin = async () => {
    try {
      // Generate the PKCE challenge pair (code_verifier and code_challenge)
      const { code_verifier, code_challenge } = await pkceChallenge()

      const redirectUri = browser.identity.getRedirectURL("oauth2")

      // Construct the OAuth authorization URL
      const authUrl =
        `${issuerUrl}/protocol/openid-connect/auth?` +
        `client_id=${clientId}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=openid profile` +
        `&code_challenge=${code_challenge}` +
        `&code_challenge_method=S256`

      // Launch the web auth flow
      const resultUrl = await browser.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      })

      // Extract the authorization code from the redirect URL
      const url = new URL(resultUrl)
      const authCode = url.searchParams.get("code")

      if (!authCode) throw new Error("No code returned")

      // Exchange the authorization code for an access token
      const tokenRes = await fetch(
        `${issuerUrl}/protocol/openid-connect/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: clientId,
            redirect_uri: redirectUri,
            code: authCode,
            code_verifier: code_verifier
          })
        }
      )

      const tokens = await tokenRes.json()
      await setStoredOptions({ accessToken: tokens.access_token })

      setMessage("Login successful!")
    } catch (err) {
      console.error("Login error:", err)
      setMessage(err.toString())
    }
  }

  return (
    <div>
      <h2>OAuth Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Issuer URL:</label>
          <input
            type="url"
            value={issuerUrl}
            onChange={(e) => setIssuerUrl(e.target.value)}
            placeholder="https://issuer.com/realms/myrealm"
            required
          />
        </div>
        <div>
          <label>Client ID:</label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="your-client-id"
            required
          />
        </div>
        <div style={{ textAlign: "right" }}>
          <button type="submit">Log In</button>
        </div>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}

export default Auth
