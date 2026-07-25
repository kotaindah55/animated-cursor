import { spawnSync } from 'child_process';
import process from 'process';

const noPush = (process.argv[2] === 'no-push');

spawnSync('npm', ['install', '--package-lock-only']);

if (!noPush) {
	spawnSync('git', ['add', 'package-lock.json']);
	spawnSync('git', ['commit', 'package-lock.json', '-m', 'chore: generate package-lock.json']);
	spawnSync('git', ['push', 'origin']);
}