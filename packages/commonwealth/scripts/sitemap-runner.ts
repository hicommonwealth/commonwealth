import { HotShotsStats, S3BlobStorage } from '@hicommonwealth/adapters';
import { blobStorage, dispose, logger, stats } from '@hicommonwealth/core';
import { PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import {
  createDatabasePaginatorDefault,
  createSitemapGenerator,
} from '@hicommonwealth/sitemaps';
import { config } from '../server/config';

const log = logger(import.meta);
blobStorage({
  adapter: S3BlobStorage(),
});
stats({
  adapter: HotShotsStats(),
});

async function doExec() {
  if (!['production', 'local'].includes(config.APP_ENV)) {
    throw new Error('Must be in production or local environment');
  }

  if (config.APP_ENV === 'local' && config.NODE_ENV === 'production') {
    throw new Error(
      'Cannot execute sitemap-runner locally with NODE_ENV=production',
    );
  }

  stats().increment('cw.scheduler.email-digest');

  log.info('Creating writer... ');
  log.info('Creating paginator... ');
  const paginator = createDatabasePaginatorDefault();

  const hostname = `sitemap.${PRODUCTION_DOMAIN}`;

  const { index } = await createSitemapGenerator(
    [paginator.threads, paginator.profiles],
    hostname,
  ).exec();

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
