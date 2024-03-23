/* eslint-disable dot-notation */
import { CacheDecorator } from '@hicommonwealth/adapters';
import { dispose } from '@hicommonwealth/core';
import type { DB, E2E_TestEntities } from '@hicommonwealth/model';
import express from 'express';
import { main } from './main';
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
  models: DB;
  seeder: ModelSeeder;
  e2eTestEntities: E2E_TestEntities;
  truncate: () => Promise<void>;
};

process.env.PORT = '8081';

/**
 * Creates local test server connected to test db and seeder utils
 * @returns test server
 */
export const testServer = async (): Promise<TestServer> => {
  const { tester } = await import('@hicommonwealth/model');
  const models = await tester.seedDb();
  const app = express();
  const { server, cacheDecorator } = await main(app, true);
  const seeder = modelSeeder(app, models);
  const e2eTestEntities = await tester.e2eTestEntities(models);

  // auto dispose server
  dispose(async () => {
    await server.close();
  });

  return {
    app,
    cacheDecorator,
    models,
    seeder,
    e2eTestEntities,
    truncate: () => tester.truncate_db(models),
  };
};
