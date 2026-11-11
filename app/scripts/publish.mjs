// Copies the finished build (dist/) to the repo root, which is what GitHub Pages serves.
// Run with: npm run publish-site   (from inside the app folder)
import { cpSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve('dist');
const root = resolve('..');
if (!existsSync(dist)) throw new Error('dist/ not found - run "npm run build" first');

// remove the old published files (only the ones the site owns)
for (const name of ['index.html', 'main.js', 'assets']) rmSync(resolve(root, name), { recursive: true, force: true });
for (const name of readdirSync(dist)) cpSync(resolve(dist, name), resolve(root, name), { recursive: true });
console.log('Published to', root, '- now commit and push to update the live site.');
