import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_olganbbrvennpqcompwx", // ganti dengan project ID kamu dari dashboard Trigger.dev
  dirs: ["./src/trigger"],
  maxDuration: 60,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      factor: 2,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
    },
  },
});