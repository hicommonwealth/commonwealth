import { factory, formatFilename } from 'common-common/src/logging';
import models from '../database';
import addTokenListsToDatabase from '../util/addTokenListsToDatabase';

const log = factory.getLogger(formatFilename(__filename));

async function main() {
  // "all" means run for all supported chains, otherwise we pass in the name of
  // the specific chain to migrate
  log.info('Started loading tokens into the DB');
  try {
    await addTokenListsToDatabase(models);
    log.info('Finished loading tokens into the DB');
    process.exit(0);
  } catch (e) {
    log.error('Failed loading tokens into the DB: ', e.message);
    process.exit(1);
  }
}

main();
