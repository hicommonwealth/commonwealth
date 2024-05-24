import { tester } from '@hicommonwealth/model';

async function main() {
  console.log('Bootstrapping test db...');
  await tester.bootstrap_testing();
  console.log('Bootstrapping test db...DONE!');
  process.exit(0);
}
void main();
