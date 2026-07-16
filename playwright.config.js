import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./test/browser",
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  outputDir: "/tmp/cic-playwright-results",
  use: {
    baseURL: "http://127.0.0.1:8800",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } }
  ],
  webServer: {
    command: "npm run build && npm start",
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: "8800",
      CIC_DB: "/tmp/cic-browser-smoke.sqlite",
      CIC_DATA_FEED: "data.example.js",
      CIC_PASSCODE: "",
      CIC_PASSCODE_HASH: "",
      // Neutralize real credentials from a local .env so smoke runs stay hermetic.
      OPENAI_API_KEY: "",
      SUPABASE_URL: "",
      SUPABASE_ANON_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      SUPABASE_SECRET_KEY: "",
      QUERY_WIKI_ACCESS_TOKEN: "",
      QUERY_WIKI_URL: "",
      SPOTIFY_ACCESS_TOKEN: "",
      SPOTIFY_REFRESH_TOKEN: "",
      SPOTIFY_CLIENT_ID: "",
      SPOTIFY_CLIENT_SECRET: "",
      GMAIL_REFRESH_COMMAND: "",
      ATLAS_URL: ""
    },
    url: "http://127.0.0.1:8800/api/auth/status",
    reuseExistingServer: false
  }
});
