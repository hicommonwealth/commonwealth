/* eslint-disable dot-notation */
import { CacheDecorator, RedisCache } from '@hicommonwealth/adapters';
import { cache, dispose } from '@hicommonwealth/core';
import type { DB, E2E_TestEntities } from '@hicommonwealth/model';
import express from 'express';
import { ModelSeeder, modelSeeder } from './test/util/modelUtils';

// handle exceptions thrown in express routes
import 'express-async-errors';

const TEST_WITHOUT_LOGS = process.env.TEST_WITHOUT_LOGS === 'true';

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
  models: DB;
  seeder: ModelSeeder;
  e2eTestEntities: E2E_TestEntities;
  truncate: () => Promise<void>;
};

/**
 * Creates local test server connected to test db and seeder utils
 * @returns test server
 */
export const testServer = async (): Promise<TestServer> => {
  // bootstrap test adapters
  cache(new RedisCache('redis://localhost:6379'));

  const { tester } = await import('@hicommonwealth/model');
  const { main } = await import('./main');

  const db = await tester.seedDb();
  const app = express();
  const { server, cacheDecorator } = await main(app, db, {
    port: 8081,
    withLoggingMiddleware: !TEST_WITHOUT_LOGS,
  });
  const seeder = modelSeeder(app, db);
  const e2eTestEntities = await tester.e2eTestEntities(db);

  // auto dispose server
  dispose(async () => {
    await server.close();
  });

  return {
    app,
    cacheDecorator,
    models: db,
    seeder,
    e2eTestEntities,
    truncate: () => tester.truncate_db(db),
  };
};
