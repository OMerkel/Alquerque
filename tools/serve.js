//
// Minimal static file server used by the Playwright end to end tests.
//

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../html5/src/', import.meta.url));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.gif': 'image/gif',
  '.txt': 'text/plain; charset=utf-8'
};

export const resolvePath = (url) => {
  const pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  const relative = normalize(pathname === '/' ? '/index.html' : pathname).replace(/^[\\/]+/, '');
  const resolved = join(ROOT, relative);
  return resolved.startsWith(ROOT.replace(new RegExp(`\\${sep}$`), '')) ? resolved : null;
};

export const createStaticServer = () =>
  createServer(async (request, response) => {
    const path = resolvePath(request.url);
    if (path === null) {
      response.writeHead(403).end('forbidden');
      return;
    }
    try {
      const body = await readFile(path);
      response.writeHead(200, {
        'content-type': TYPES[extname(path)] ?? 'application/octet-stream'
      });
      response.end(body);
    } catch {
      response.writeHead(404).end('not found');
    }
  });

const port = Number(process.env.PORT ?? 4173);
createStaticServer().listen(port, () => {
  process.stdout.write(`Alquerque served on http://localhost:${port}/\n`);
});
