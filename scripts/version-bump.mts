import { readFileSync, writeFileSync } from "fs";
import { getLastChangelog } from "./utils.mjs";
import { execSync } from "child_process";

export type ManifestConfig = {
	version: string;
	minAppVersion: string;
}

export type PackageConfig = {
	version: string;
}

export type VersionRecord = Record<string, string>;

let { version: targetVersion } = await getLastChangelog(),
	message = "chore: bump version to " + targetVersion,
	tobeCommitted = "manifest.json package.json versions.json CHANGELOGS.txt";

// read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync("manifest.json", "utf8")) as ManifestConfig,
	{ minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

// update versions.json with target version and minAppVersion from manifest.json
let versions = JSON.parse(readFileSync("versions.json", "utf8")) as VersionRecord;
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));

// update package.json with target version
let packageConf = JSON.parse(readFileSync("package.json", "utf-8")) as PackageConfig;
packageConf.version = targetVersion;
writeFileSync("package.json", JSON.stringify(packageConf, null, "\t"));

try {
	execSync(`git add ${tobeCommitted} && git commit ${tobeCommitted} -m "${message}"`);
	execSync("git push origin");
	console.log(`Package has been successfully bumped to: ${targetVersion}`);
} catch (error) {
	console.log("Error encountered when version bumping: ", error);
}