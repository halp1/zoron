import { execSync } from "node:child_process";

export namespace CONSTANTS {
  export const name = "Zoron";
  export const url = "zoron.app";
  export const passkeyExpiration = 1000 * 60 * 5;
	export const commit = execSync('git rev-parse --short HEAD').toString().trim();
}
