import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

const output = resolve('.output/chrome-mv3');
const downloads = resolve('site/public/downloads');
await mkdir(downloads, { recursive: true });
await rm(resolve(downloads, 'feed-later-bridge-chrome.zip'), { force: true });
const archive = resolve(downloads, 'feed-later-bridge-chrome.zip');
await promisify(execFile)('zip', ['-qr', archive, '.'], { cwd: output });
console.log('Packaged site/public/downloads/feed-later-bridge-chrome.zip');
