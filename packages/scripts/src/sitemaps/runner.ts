import { logger } from '@hicommonwealth/logging';
import {
  createAsyncWriterS3,
  createDatabasePaginatorDefault,
  createSitemapGenerator,
} from '@hicommonwealth/sitemaps';

const log = logger(__filename);

async function doExec() {
  log.info('Creating writer... ');
  const writer = createAsyncWriterS3();
  log.info('Creating paginator... ');
  const paginator = createDatabasePaginatorDefault();

  const { index } = await createSitemapGenerator(writer, [
    paginator.threads,
    paginator.profiles,
  ]).exec();

  log.info('Sitemap written to: ' + index.location);

  process.exit(0);
}

doExec().catch((err) => {
  log.fatal('Unable to process sitemaps: ', err);
  process.exit(1);
});
