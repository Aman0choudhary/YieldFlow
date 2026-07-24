import { createServer } from "node:http";
import { handleRequest } from "../api-src/handler.mjs";

const port = Number(process.env.PORT || process.env.YIELDFLOW_API_PORT || 8787);
const server = createServer((req, res) => {
  handleRequest(req, res);
});
server.listen(port, "0.0.0.0", () => {
  console.log(`YieldFlow backend listening on port ${port}`);
});
