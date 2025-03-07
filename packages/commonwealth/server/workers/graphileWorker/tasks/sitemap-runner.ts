import { logger, stats } from '@hicommonwealth/core';
import { PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import {
  createDatabasePaginatorDefault,
  createSitemapGenerator,
} from '@hicommonwealth/sitemaps';
import { z } from 'zod';
import { config } from '../../../config';
import { GraphileTask } from '../types';

const log = logger(import.meta);

const updateSitemaps = async () => {
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
};

export const sitemapTask: GraphileTask = {
  input: z.undefined(),
  fn: updateSitemaps,
};
