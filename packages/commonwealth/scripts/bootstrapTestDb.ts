import { dispose } from '@hicommonwealth/core';
import { buildDb, config, syncDb, tester } from '@hicommonwealth/model';
import { Sequelize } from 'sequelize';

async function main() {
  console.log('Bootstrapping test db...');
  try {
    await tester.verify_db(config.DB.NAME);
    const db = buildDb(
      new Sequelize({
        dialect: 'postgres',
        database: config.DB.NAME,
        username: 'commonwealth',
        password: 'edgeware',
        logging: false,
      }),
    );
    await syncDb(db);
    console.log('Bootstrapping test db...DONE!');
  } catch (e) {
    console.log('Bootstrapping test db...FAIL!');
    console.error(e);
    await dispose()('ERROR', true);
  }
  await dispose()('EXIT', true);
}
void main();
