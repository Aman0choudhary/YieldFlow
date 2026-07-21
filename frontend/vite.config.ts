import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Expose SDK mode to the browser bundle (default mock).
  envPrefix: ["VITE_"],
  define: {
    // Ensure import.meta.env.VITE_YIELDFLOW_SDK is always defined for SDK entry.
    "import.meta.env.VITE_YIELDFLOW_SDK": JSON.stringify(
      process.env.VITE_YIELDFLOW_SDK || "mock",
    ),
  },
});
