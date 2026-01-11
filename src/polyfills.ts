import process from 'process';
if (!(globalThis as any).process) {
  (globalThis as any).process = { env: { NODE_ENV: 'production', ...process.env } };
}