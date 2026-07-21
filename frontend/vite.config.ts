import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_"],
  define: {
    "import.meta.env.VITE_YIELDFLOW_SDK": JSON.stringify(
      process.env.VITE_YIELDFLOW_SDK || "mock",
    ),
    "import.meta.env.VITE_VAULT_CONTRACT_ID": JSON.stringify(
      process.env.VITE_VAULT_CONTRACT_ID || "",
    ),
    "import.meta.env.VITE_STREAMING_CONTRACT_ID": JSON.stringify(
      process.env.VITE_STREAMING_CONTRACT_ID || "",
    ),
    "import.meta.env.VITE_DEFINDEX_CONTRACT_ID": JSON.stringify(
      process.env.VITE_DEFINDEX_CONTRACT_ID || "",
    ),
    "import.meta.env.VITE_SOURCE_PUBLIC_KEY": JSON.stringify(
      process.env.VITE_SOURCE_PUBLIC_KEY || "",
    ),
  },
});
