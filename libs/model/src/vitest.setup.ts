import path from 'path';
import { beforeAll } from 'vitest';

beforeAll(async ({ name }) => {
  const lcsuite = name.includes('-lifecycle');
  if (lcsuite) {
    const suite_name = path.basename(name, '.spec.ts');
    const suite_db = 'test_' + suite_name.replace(/-/g, '_');

    const { config } = await import('./config');
    config.DB.NAME = suite_db;
    config.DB.URI = `postgresql://commonwealth:edgeware@localhost/${suite_db}`;

    const { connect_sequelize } = await import('./database');
    const { sequelize } = connect_sequelize();
    console.log(`LC-SUITE: ${suite_name} => ${sequelize.config.database}`);
  }
});
