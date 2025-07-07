/* eslint-disable dot-notation */
import { CacheDecorator, RedisCache } from '@hicommonwealth/adapters';
import { cache, dispose } from '@hicommonwealth/core';
import { tester, type E2E_TestEntities } from '@hicommonwealth/model';
import express from 'express';
import 'express-async-errors'; // handle exceptions thrown in express routes
import { main } from './main';
import { config } from './server/config';
import { ModelSeeder, modelSeeder } from './test/util/modelUtils';

/**
 * Encapsulates all the infrastructure required for integration testing, including:
 * - app: Express app exposing server endpoints
 * - cacheDecorator: Redis cache decorator used to cache requests
 * - models: Direct access to the sequelize models
 * - seeder: Model seeding utilities
 * - e2eTestEntities: Some integrations are coupled with entities generated in e2e tests 😱
 *
 * @remarks An pre-seeded test db is generated for each test
 * @deprecated Not a good practice to generalize and hide test details, use new `seed` instead
 */
export type TestServer = {
  app: express.Express;
  cacheDecorator: CacheDecorator;
  seeder: ModelSeeder;
  e2eTestEntities: E2E_TestEntities;
  baseUrl: string;
};

/**
 * Creates local test server connected to test db and seeder utils
 * @returns test server
 */
export const testServer = async (): Promise<TestServer> => {
  // bootstrap test adapters
  cache({
    adapter: new RedisCache('redis://localhost:6379'),
  });
  await tester.seedDb();
  const app = express();
  const seeder = modelSeeder(app);
  const e2eTestEntities = await tester.e2eTestEntities();

  const port = 8081;
  const { server, cacheDecorator } = await main(app, {
    port,
    withLoggingMiddleware: !config.LOGGING.TEST_WITHOUT_LOGS,
  });

  // auto dispose server
  dispose(async () => {
    await server.close();
  });

  return {
    app,
    cacheDecorator,
    seeder,
    e2eTestEntities,
    baseUrl: `http://localhost:${port}`,
  };
};
