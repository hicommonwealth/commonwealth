import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql/build/postgresql-container';
import { spawnSync } from 'child_process';
import * as process from 'process';
import { Sequelize } from 'sequelize';
import { sequelizeMigrationUp } from '../util/sequlizeMigration';

async function startE2e() {
  const args: string[] = process.argv[2]
    ? process.argv.slice(2, process.argv.length)
    : ['test-e2e-mature'];

  console.log('Running test suite', args[0]);

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

  const returnValue = spawnSync('yarn', args, { stdio: 'inherit' });
  if (returnValue.status) {
    process.exit(returnValue.status);
  }
}

startE2e().then();
