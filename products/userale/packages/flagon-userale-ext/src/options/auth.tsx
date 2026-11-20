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
import { useEffect, useState } from "react"
import browser from "webextension-polyfill"

import {
  generateOAuthState,
  validateIssuerUrl,
  verifyOAuthState
} from "~/utils/security"
import { getStoredOptions, setStoredOptions } from "~/utils/storage"
import type { StoredOptions } from "~/utils/storage"

function Auth() {
  const [authMode, setAuthMode] = useState<StoredOptions["authMode"]>("none")
  const [apiKey, setApiKey] = useState("")
  const [issuerUrl, setIssuerUrl] = useState("")
  const [clientId, setClientId] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    getStoredOptions().then((opts) => {
      setAuthMode(opts.authMode)
      setApiKey(opts.apiKey)
    })
  }, [])

  const handleAuthModeChange = async (mode: StoredOptions["authMode"]) => {
    setAuthMode(mode)
    setMessage("")
    if (mode === "none") {
      await setStoredOptions({ authMode: "none", accessToken: "", apiKey: "" })
      setApiKey("")
      setMessage("Auth disabled.")
    }
  }

  const handleSaveApiKey = async () => {
    await setStoredOptions({
      authMode: "apikey",
      apiKey,
      accessToken: ""
    })
    setMessage("API key saved.")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const normalizedIssuer = validateIssuerUrl(issuerUrl)
      const trimmedClientId = clientId.trim()
      if (!trimmedClientId) {
        throw new Error("Client ID is required")
      }

      // Generate the PKCE challenge pair and cryptographic CSRF state
      const { code_verifier, code_challenge } = await pkceChallenge()
      const expectedState = generateOAuthState()

      const redirectUri = browser.identity.getRedirectURL("oauth2")

      // Construct the OAuth authorization URL
      const authEndpoint = new URL(
        `${normalizedIssuer}/protocol/openid-connect/auth`
      )
      authEndpoint.searchParams.set("client_id", trimmedClientId)
      authEndpoint.searchParams.set("response_type", "code")
      authEndpoint.searchParams.set("redirect_uri", redirectUri)
      authEndpoint.searchParams.set("scope", "openid profile")
      authEndpoint.searchParams.set("state", expectedState)
      authEndpoint.searchParams.set("code_challenge", code_challenge)
      authEndpoint.searchParams.set("code_challenge_method", "S256")

      // Launch the web auth flow
      const resultUrl = await browser.identity.launchWebAuthFlow({
        url: authEndpoint.toString(),
        interactive: true
      })

      // Extract and verify state and authorization code from the redirect URL
      const url = new URL(resultUrl)
      const oauthError = url.searchParams.get("error")
      if (oauthError) {
        throw new Error(`OAuth authorization failed: ${oauthError}`)
      }

      const returnedState = url.searchParams.get("state")
      if (!verifyOAuthState(expectedState, returnedState)) {
        throw new Error("Invalid OAuth state parameter")
      }

      const authCode = url.searchParams.get("code")
      if (!authCode) throw new Error("No code returned")

      // Exchange the authorization code for an access token
      const tokenRes = await fetch(
        `${normalizedIssuer}/protocol/openid-connect/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: trimmedClientId,
            redirect_uri: redirectUri,
            code: authCode,
            code_verifier: code_verifier
          })
        }
      )

      if (!tokenRes.ok) {
        throw new Error(
          `Token exchange failed with HTTP status ${tokenRes.status}`
        )
      }

      const tokens = await tokenRes.json()
      if (
        !tokens ||
        typeof tokens.access_token !== "string" ||
        tokens.access_token.length === 0
      ) {
        throw new Error("Token response did not contain a valid access token")
      }

      await setStoredOptions({
        authMode: "oauth",
        accessToken: tokens.access_token,
        apiKey: ""
      })

      setMessage("Login successful!")
    } catch (err) {
      console.error("Login error:", err)
      setMessage(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div>
      <h2>Authentication</h2>
      <div>
        <label>
          <input
            type="radio"
            name="authMode"
            value="none"
            checked={authMode === "none"}
            onChange={() => handleAuthModeChange("none")}
          />
          None
        </label>
        <label style={{ marginLeft: 16 }}>
          <input
            type="radio"
            name="authMode"
            value="oauth"
            checked={authMode === "oauth"}
            onChange={() => handleAuthModeChange("oauth")}
          />
          OAuth
        </label>
        <label style={{ marginLeft: 16 }}>
          <input
            type="radio"
            name="authMode"
            value="apikey"
            checked={authMode === "apikey"}
            onChange={() => handleAuthModeChange("apikey")}
          />
          API Key
        </label>
      </div>

      {authMode === "oauth" && (
        <div>
          <h3>OAuth Login</h3>
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
        </div>
      )}

      {authMode === "apikey" && (
        <div>
          <h3>API Key</h3>
          <div>
            <label>API Key:</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
            />
          </div>
          <div style={{ textAlign: "right" }}>
            <button type="button" onClick={handleSaveApiKey}>
              Save
            </button>
          </div>
        </div>
      )}

      {message && <p>{message}</p>}
    </div>
  )
}

export default Auth
