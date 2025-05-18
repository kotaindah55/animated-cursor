import { open } from "fs/promises";

interface ChangelogDesc {
	version: string;
	changelog: string;
}

const VERSION_VALIDATOR = /^\[(\d+\.\d+\.\d+)\]$/;
const END_OF_CHANGELOG = /^---$/;

export async function getLastChangelog(): Promise<ChangelogDesc> {
	let changelogFile = await open("CHANGELOGS.txt", "r", ),
		changelog = "",
		version = "",
		lineIndex = 0;

	for await (let line of changelogFile.readLines({
		encoding: "utf-8",
	})) {
		if (!version) {
			if (!lineIndex) version = VERSION_VALIDATOR.exec(line)?.[1] ?? "";
			if (!version) {
				changelogFile.close();
				throw Error("Not a valid version token!");
			}
		}

		else {
			if (END_OF_CHANGELOG.test(line)) {
				changelogFile.close();
				break;
			}
			changelog += line + "\n";
		}
	}

	return { changelog, version };
}