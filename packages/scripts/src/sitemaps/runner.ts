import { HotShotsStats, S3BlobStorage } from '@hicommonwealth/adapters';
import { blobStorage, dispose, logger, stats } from '@hicommonwealth/core';
import {
  createDatabasePaginatorDefault,
  createSitemapGenerator,
} from '@hicommonwealth/sitemaps';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);
blobStorage(S3BlobStorage());

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
  log.info('Creating paginator... ');
  const paginator = createDatabasePaginatorDefault();

  const { index } = await createSitemapGenerator([
    paginator.threads,
    paginator.profiles,
  ]).exec();

  log.info('Sitemap written to: ' + index.location);
}

doExec()
  .then(() => {
    dispose()('EXIT', true);
  })
  .catch((err) => {
    log.fatal('Unable to process sitemaps: ', err);
    dispose()('ERROR', true);
  });
