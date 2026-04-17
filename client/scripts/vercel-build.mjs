import { spawn } from 'node:child_process';

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: false });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`));
      }
    });
    child.on('error', reject);
  });
}

async function main() {
  console.log('[client vercel-build] Building client app...');
  if (process.platform === 'win32') {
    await run('cmd.exe', ['/d', '/s', '/c', 'npm run build']);
  } else {
    await run('npm', ['run', 'build']);
  }
  console.log('[client vercel-build] Done. Output directory: dist');
}

main().catch((error) => {
  console.error('[client vercel-build] Failed:', error);
  process.exit(1);
});
