import { dispose } from '@hicommonwealth/core';
import { tester } from '@hicommonwealth/model';

async function main() {
  console.log('Bootstrapping E2E test...');
  await tester.bootstrap_testing();
  await dispose()('EXIT', true);
}
void main();
