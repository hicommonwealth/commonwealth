import * as dotenv from 'dotenv';

dotenv.config({ path: `../../.env` });

export default {
  test: {
    username: 'commonwealth',
    password: 'edgeware',
    database: 'common_test',
    host: '127.0.0.1',
    dialect: 'postgres',
  },
  // eslint-disable-next-line no-undef
  development: process.env.DATABASE_URL
    ? {
        use_env_variable: 'DATABASE_URL',
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
      }
    : {
        username: 'commonwealth',
        password: 'edgeware',
        database: 'commonwealth',
        host: '127.0.0.1',
        dialect: 'postgres',
      },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  },
};
