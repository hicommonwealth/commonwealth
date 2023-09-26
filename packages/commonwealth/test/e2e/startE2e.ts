import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql/build/postgresql-container';
import { spawnSync } from 'child_process';
import * as process from 'process';
import { Sequelize } from 'sequelize';
import { sequelizeMigrationUp } from '../util/sequlizeMigration';

async function startE2e() {
  const suiteToRun = process.argv[2] ? process.argv[2] : 'test-e2e-mature';

  console.log('Running test suite', suiteToRun);

  let pgContainer: StartedPostgreSqlContainer;
  try {
    pgContainer = await new PostgreSqlContainer().start();
  } catch (e) {
    console.error(
      'You need to install and have the docker daemon running to run e2e tests'
    );
    process.exit(1);
  }
  // set the connectionURI for tests (cannot export because workers run in different processes)
  process.env.DATABASE_URL = pgContainer.getConnectionUri();
  console.log('Database started on:', process.env.DATABASE_URL);

  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: false,
  });

  await sequelizeMigrationUp(sequelize);

  console.log('Database migration finished');

  try {
    spawnSync('yarn', [suiteToRun], { stdio: 'inherit' });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

startE2e().catch(() => {
  process.exit(1);
});
