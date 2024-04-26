import { logger } from '@hicommonwealth/logging';
import {
  createAsyncWriterS3,
  createDatabasePaginatorDefault,
  createSitemapGenerator,
} from '@hicommonwealth/sitemaps';

const log = logger(__filename);

async function doExec() {
  if (process.env.NODE_ENV !== 'production') {
    // we have to enforce production because if we don't we will get localhost
    // URLs and that might be very destructive to our SEO
    throw new Error('Must run with NODE_ENV=production');
  }

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
