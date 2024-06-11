import { dispose } from '@hicommonwealth/core';
import { tester } from '@hicommonwealth/model';

async function main() {
  console.log('Bootstrapping test db...');
  try {
    await tester.bootstrap_testing(false);
    console.log('Bootstrapping test db...DONE!');
  } catch (e) {
    console.log('Bootstrapping test db...FAIL!');
    console.error(e);
  }
  await dispose()('EXIT', true);
}
void main();
