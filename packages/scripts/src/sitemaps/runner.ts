import { HotShotsStats } from '@hicommonwealth/adapters';
import { stats } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import {
  createAsyncWriterS3,
  createDatabasePaginatorDefault,
  createSitemapGenerator,
} from '@hicommonwealth/sitemaps';
import * as dotenv from 'dotenv';

dotenv.config();
const log = logger(__filename);

async function doExec() {
  if (process.env.SITEMAP_ENV !== 'production') {
    throw new Error(
      'Define SITEMAP_ENV to signify you understand that this should only run in production to avoid breaking sitemaps.',
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    // we have to enforce production because if we don't we will get localhost
    // URLs and that might be very destructive to our SEO
    throw new Error('Must run with NODE_ENV=production');
  }

  stats(HotShotsStats()).increment('cw.scheduler.email-digest');

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
