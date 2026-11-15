// @ts-check
import { defineConfig } from "astro/config";

// Astro's settings. Reference: https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // The site's public address. Change this if you attach your own domain.
  site: "https://ky-hoang.github.io",

  // Hide Astro's floating toolbar while previewing locally
  devToolbar: { enabled: false },
});
