import {
  defineConfig
} from "../../../chunk-ARVRABRY.mjs";
import {
  init_esm
} from "../../../chunk-CEGEFIIW.mjs";

// trigger.config.ts
init_esm();
var trigger_config_default = defineConfig({
  // ganti dengan project ID kamu dari dashboard Trigger.dev
  project: "proj_olganbbrvennpqcompwx",
  dirs: ["./src/trigger"],
  maxDuration: 60,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      factor: 2,
      minTimeoutInMs: 1e3,
      maxTimeoutInMs: 1e4
    }
  },
  build: {}
});
var resolveEnvVars = void 0;
export {
  trigger_config_default as default,
  resolveEnvVars
};
//# sourceMappingURL=trigger.config.mjs.map
