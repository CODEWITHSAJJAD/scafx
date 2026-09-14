import { execSync } from 'node:child_process';
import path from 'node:path';
import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  '\n🔑 Enter your 6-digit NPM 2FA / OTP code (or press Enter if using a Bypass 2FA Token): ',
  (otp) => {
    rl.close();
    const trimmedOtp = otp.trim();
    const otpFlag = trimmedOtp ? `--otp=${trimmedOtp}` : '';

    const packages = [
      { name: '@codewithsajjad01/core', dir: 'packages/core' },
      { name: '@codewithsajjad01/preflight', dir: 'packages/preflight' },
      { name: '@codewithsajjad01/templates', dir: 'packages/templates' },
      { name: '@codewithsajjad01/scafx', dir: 'packages/cli' },
    ];

    console.log('\n🚀 Publishing packages to NPM registry...\n');

    for (const pkg of packages) {
      console.log(`📦 Publishing ${pkg.name}...`);
      const targetDir = path.resolve(pkg.dir);
      const cmd = `pnpm publish --access public --no-git-checks ${otpFlag}`.trim();

      try {
        execSync(cmd, {
          cwd: targetDir,
          stdio: 'inherit',
          shell: true,
        });
        console.log(`✅ Successfully published ${pkg.name}!\n`);
      } catch (err) {
        // Check if error is because version already exists on npm
        console.warn(`⚠️ Could not publish ${pkg.name} (it may already be published at this version).\n`);
      }
    }

    console.log('🎉 Release process completed!');
    console.log('✨ You can now test: npx @codewithsajjad01/scafx new\n');
  },
);
