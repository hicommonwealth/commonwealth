import { createAsyncWriterS3 } from './createAsyncWriter';
import { createDatabasePaginatorDefault } from './createDatabasePaginator';
import { createSitemapGenerator } from './createSitemapGenerator';

async function doExec() {
  const writer = createAsyncWriterS3();
  const paginator = createDatabasePaginatorDefault();

  await createSitemapGenerator(writer, [
    paginator.threads,
    paginator.profiles,
  ]).exec();
}

doExec().catch(console.error);
