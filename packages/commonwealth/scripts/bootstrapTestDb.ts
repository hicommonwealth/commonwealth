import { dispose } from '@hicommonwealth/core';
import { bootstrap_testing } from '@hicommonwealth/model/tester';

async function main() {
  console.log('Bootstrapping E2E test...');
  await bootstrap_testing(true);
  await dispose()('EXIT', true);
}
void main();
