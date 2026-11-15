import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "luna-tracker",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-15",
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      // Runtime secrets. Set the values in the Cloudflare dashboard
      // (Settings -> Variables and Secrets), or in .dev.vars for local runs.
      // NEXT_PUBLIC_* values are not listed here: they are baked in at build time.
      SUPABASE_SERVICE_ROLE_KEY: bindings.secret(),
      INVITE_CODE: bindings.secret(),
    },
  }),
});
