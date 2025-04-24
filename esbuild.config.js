import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outdir: 'dist',
  format: 'esm',
  packages: 'external',
  banner: {
    js: `
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
      import { fileURLToPath } from 'url';
      import { dirname } from 'path';
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
    `
  }
}); 