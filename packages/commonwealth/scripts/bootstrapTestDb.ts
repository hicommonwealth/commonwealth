import { dispose } from '@hicommonwealth/core';
import { tester } from '@hicommonwealth/model';

async function main() {
  console.log('Bootstrapping test db...');
  await tester.bootstrap_testing();
  await dispose()('EXIT', true);
}
void main();
