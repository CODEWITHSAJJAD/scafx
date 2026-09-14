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
      { name: 'scafx (CLI)', dir: 'packages/cli' },
    ];

    console.log('\n🚀 Publishing packages to NPM registry...\n');

    for (const pkg of packages) {
      console.log(`📦 Publishing ${pkg.name}...`);
      const targetDir = path.resolve(pkg.dir);
      const cmd = `npm publish --access public ${otpFlag}`.trim();

      try {
        execSync(cmd, {
          cwd: targetDir,
          stdio: 'inherit',
          shell: true,
        });
        console.log(`✅ Successfully published ${pkg.name}!\n`);
      } catch (err) {
        console.error(`\n❌ Failed to publish ${pkg.name}.`);
        console.error(
          `💡 TIP: If you see "Two-factor authentication required", generate a fresh 6-digit OTP code or create an NPM Classic Automation Token at https://www.npmjs.com/settings/codewithsajjad01/tokens\n`,
        );
        process.exit(1);
      }
    }

    console.log('🎉 All packages published successfully to NPM!');
    console.log('✨ You can now test: npx scafx new\n');
  },
);
