import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadDeploymentEnv() {
  const defaults = {
    VITE_YIELDFLOW_SDK: process.env.VITE_YIELDFLOW_SDK || "mock",
    VITE_VAULT_CONTRACT_ID: process.env.VITE_VAULT_CONTRACT_ID || "",
    VITE_STREAMING_CONTRACT_ID: process.env.VITE_STREAMING_CONTRACT_ID || "",
    VITE_DEFINDEX_CONTRACT_ID: process.env.VITE_DEFINDEX_CONTRACT_ID || "",
    VITE_SOURCE_PUBLIC_KEY: process.env.VITE_SOURCE_PUBLIC_KEY || "",
  };

  const deploymentPath = resolve(__dirname, "../deployments/testnet.json");
  if (!existsSync(deploymentPath)) return defaults;

  try {
    const raw = JSON.parse(readFileSync(deploymentPath, "utf8"));
    const contracts = raw.contracts || {};
    if (!defaults.VITE_VAULT_CONTRACT_ID && contracts.vault) {
      defaults.VITE_VAULT_CONTRACT_ID = String(contracts.vault);
    }
    if (!defaults.VITE_STREAMING_CONTRACT_ID && contracts.streaming) {
      defaults.VITE_STREAMING_CONTRACT_ID = String(contracts.streaming);
    }
    if (!defaults.VITE_DEFINDEX_CONTRACT_ID && contracts.defindex_router) {
      defaults.VITE_DEFINDEX_CONTRACT_ID = String(contracts.defindex_router);
    }
  } catch {
    // ignore invalid deployment file
  }
  return defaults;
}

const env = loadDeploymentEnv();

export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_"],
  define: {
    "import.meta.env.VITE_YIELDFLOW_SDK": JSON.stringify(env.VITE_YIELDFLOW_SDK),
    "import.meta.env.VITE_VAULT_CONTRACT_ID": JSON.stringify(env.VITE_VAULT_CONTRACT_ID),
    "import.meta.env.VITE_STREAMING_CONTRACT_ID": JSON.stringify(env.VITE_STREAMING_CONTRACT_ID),
    "import.meta.env.VITE_DEFINDEX_CONTRACT_ID": JSON.stringify(env.VITE_DEFINDEX_CONTRACT_ID),
    "import.meta.env.VITE_SOURCE_PUBLIC_KEY": JSON.stringify(env.VITE_SOURCE_PUBLIC_KEY),
  },
});
