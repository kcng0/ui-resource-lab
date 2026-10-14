import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Project Pages URL: https://kcng0.github.io/ui-resource-lab/
const base = process.env.GITHUB_PAGES === "true" ? "/ui-resource-lab/" : "/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
});
