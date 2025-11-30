import { existsSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";

const packageEnvPath = path.resolve(__dirname, "../..", ".env");
const workspaceEnvPath = path.resolve(__dirname, "../../../..", ".env");

if (existsSync(workspaceEnvPath)) {
  config({ path: workspaceEnvPath });
}

if (existsSync(packageEnvPath)) {
  config({ path: packageEnvPath, override: true });
}
