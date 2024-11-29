import path from 'path';
import { beforeAll } from 'vitest';
import { bootstrap_testing } from './tester';

beforeAll(async ({ name }) => {
  const lcsuite = name.includes('-lifecycle');
  if (lcsuite) {
    const suite_name = path.basename(name, '.spec.ts');
    const suite_db = 'test_' + suite_name.replace(/-/g, '_');

    const { config } = await import('./config');
    config.DB.NAME = suite_db;
    config.DB.URI = `postgresql://commonwealth:edgeware@localhost/${suite_db}`;

    const { sequelize, connect_sequelize } = await import('./database');
    await sequelize.close();
    const { sequelize: vite_sequelize } = connect_sequelize();
    console.log(`LC-SUITE: ${suite_name} => ${vite_sequelize.config.database}`);
  }

  // Single point of test bootstrapping!
  // Only when running tests in libs/model and legacy commonwealth
  if (
    ['@hicommonwealth/model', 'commonwealth'].includes(
      process.env.npm_package_name ?? '',
    )
  )
    await bootstrap_testing();
});
