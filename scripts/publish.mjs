import { execSync } from 'node:child_process';
import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\n🔑 Enter your 6-digit NPM 2FA / OTP code: ', (otp) => {
  rl.close();
  const trimmedOtp = otp.trim();

  if (!trimmedOtp) {
    console.error('❌ OTP code cannot be empty.');
    process.exit(1);
  }

  const packages = [
    { name: '@codewithsajjad01/core', path: 'packages/core' },
    { name: '@codewithsajjad01/preflight', path: 'packages/preflight' },
    { name: '@codewithsajjad01/templates', path: 'packages/templates' },
    { name: 'scafx (CLI)', path: 'packages/cli' },
  ];

  console.log('\n🚀 Publishing packages to NPM registry...\n');

  for (const pkg of packages) {
    console.log(`📦 Publishing ${pkg.name}...`);
    try {
      execSync(`npm publish ./${pkg.path} --access public --otp=${trimmedOtp}`, {
        stdio: 'inherit',
        shell: true,
      });
      console.log(`✅ Successfully published ${pkg.name}!\n`);
    } catch (err) {
      console.error(`❌ Failed to publish ${pkg.name}.`);
      process.exit(1);
    }
  }

  console.log('🎉 All packages published successfully to NPM!');
  console.log('✨ You can now run: npx scafx new\n');
});
