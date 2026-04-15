import { defineConfig, devices } from "@playwright/test";
import path from "path";

export default defineConfig({
  testDir: "./",
  testMatch: "**/*.spec.ts",
  timeout: 300_000, // 5 minutes max per test
  retries: 0,
  workers: 1, // run sequentially for recording
  reporter: [
    ["list"],
  ],
  use: {
    baseURL: "http://76.13.17.91",
    headless: true,
    viewport: { width: 1280, height: 800 },
    // TURN OFF VIDEO DARI PLAYWRIGHT KARENA AKAN RECORD PAKAI OBS
    video: "off",
    screenshot: "off",
    trace: "off",
    // Perlambat agar bisa direkam dengan jelas di OBS
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    launchOptions: {
      slowMo: 600, // 600ms per action agar animasinya terlihat santai
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
