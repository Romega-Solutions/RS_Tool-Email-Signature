import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

const adapter = process.env.VERCEL === "1"
  ? vercel()
  : node({
      mode: "standalone",
    });

export default defineConfig({
  output: "server",
  adapter,
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
