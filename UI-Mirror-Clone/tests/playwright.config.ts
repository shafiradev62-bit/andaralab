import { defineConfig, devices } from "@playwright/test";
import path from "path";

export default defineConfig({
  testDir: "./",
  testMatch: "**/*.spec.ts",
  timeout: 300_000,
  retries: 0,
  workers: 1,
  reporter: [
    ["list"],
  ],
  use: {
    baseURL: "http://localhost:5173",
    headless: false,
    viewport: { width: 1280, height: 800 },
    video: "off",
    screenshot: "off",
    trace: "off",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    launchOptions: {
      slowMo: 600,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
