import { Sequelize } from 'sequelize';

const DATABASE_URI = process.env.USES_DOCKER_DB
  ? 'postgresql://commonwealth:edgeware@postgres/commonwealth' // this is because url will be hidden in CI.yaml
  : !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
  ? 'postgresql://commonwealth:edgeware@localhost/commonwealth'
  : process.env.DATABASE_URL;

export const sequelize = new Sequelize(DATABASE_URI, {
  logging:
    process.env.NODE_ENV === 'test'
      ? false
      : (msg) => {
          console.log(msg);
        },
  dialectOptions:
    process.env.NODE_ENV !== 'production'
      ? { requestTimeout: 40000 }
      : DATABASE_URI ===
        'postgresql://commonwealth:edgeware@localhost/commonwealth'
      ? { requestTimeout: 40000, ssl: false }
      : { requestTimeout: 40000, ssl: { rejectUnauthorized: false } },
  pool: {
    max: 10,
    min: 0,
    acquire: 40000,
    idle: 40000,
  },
});
