import { HotShotsStats, S3BlobStorage } from '@hicommonwealth/adapters';
import { blobStorage, dispose, logger, stats } from '@hicommonwealth/core';
import {
  createDatabasePaginatorDefault,
  createSitemapGenerator,
} from '@hicommonwealth/sitemaps';

const log = logger(import.meta);
blobStorage({
  adapter: S3BlobStorage(),
});
stats({
  adapter: HotShotsStats(),
});

async function doExec() {
  if (process.env.SITEMAP_ENV !== 'production') {
    throw new Error(
      // eslint-disable-next-line max-len
      'Define SITEMAP_ENV to signify you understand that this should only run in production to avoid breaking sitemaps.',
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    // we have to enforce production because if we don't we will get localhost
    // URLs and that might be very destructive to our SEO
    throw new Error('Must run with NODE_ENV=production');
  }

  stats().increment('cw.scheduler.email-digest');

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
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('EXIT', true);
  })
  .catch((err) => {
    log.fatal('Unable to process sitemaps: ', err);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('ERROR', true);
  });
