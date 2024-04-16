import { logger } from '@hicommonwealth/logging';
import { createAsyncWriterS3 } from './createAsyncWriter';
import { createDatabasePaginatorDefault } from './createDatabasePaginator';
import { createSitemapGenerator } from './createSitemapGenerator';

const log = logger(__filename);

async function doExec() {
  const writer = createAsyncWriterS3();
  const paginator = createDatabasePaginatorDefault();

  await createSitemapGenerator(writer, [
    paginator.threads,
    paginator.profiles,
  ]).exec();
}

doExec().catch((err) => log.fatal('Unable to process sitemaps: ', err));
