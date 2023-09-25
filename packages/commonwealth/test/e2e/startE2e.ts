import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { spawnSync } from 'child_process';
import { Sequelize } from 'sequelize';
import { sequelizeMigrationUp } from '../util/sequlizeMigration';

async function startE2e() {
  const suiteToRun = process.argv[2] ? process.argv[2] : 'test-e2e-mature';

  console.log('Running test suite', suiteToRun);

  const pgContainer = await new PostgreSqlContainer().start();
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
    console.log(e);
  }
}

startE2e().catch((e) => console.error(e));
