import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import { ManifestConfig } from "./version-bump.mjs";
import process from "process";

let { version } = JSON.parse(readFileSync("manifest.json", "utf8")) as ManifestConfig;

if (process.argv[2] !== "no-package-lock")
	spawnSync("npm", ["run", "lock"]);

spawnSync("git", ["tag", "-a", version, "-f", "-m", `"${version}"`]);
spawnSync("git", ["push", "-f", "origin", version]);