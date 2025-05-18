import { spawnSync } from "child_process";

spawnSync("npm", ["install", "--package-lock-only"]);
spawnSync("git", ["add", "package-lock.json"]);
spawnSync("git", ["commit", "package-lock.json", "-m", "chore: generate package-lock.json"]);
spawnSync("git", ["push", "origin"]);