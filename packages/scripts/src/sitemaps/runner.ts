import { logger } from '@hicommonwealth/logging';
import {
  createAsyncWriterS3,
  createDatabasePaginatorDefault,
  createSitemapGenerator,
} from '@hicommonwealth/sitemaps';

const log = logger(__filename);

async function doExec() {
  console.log('Creating writer... ');
  const writer = createAsyncWriterS3();
  console.log('Creating paginator... ');
  const paginator = createDatabasePaginatorDefault();

  await createSitemapGenerator(writer, [
    paginator.threads,
    paginator.profiles,
  ]).exec();

  process.exit(0);
}

doExec().catch((err) => {
  log.fatal('Unable to process sitemaps: ', err);
  process.exit(1);
});
