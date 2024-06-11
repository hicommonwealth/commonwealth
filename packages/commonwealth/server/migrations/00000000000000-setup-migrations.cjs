'use strict';

// We can't convert migrations to ESM because `npx sequelize db:migrate` uses
// Umzug to require() each migration, which fails if the migration is a module.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`UPDATE "SequelizeMeta" SET name = REPLACE(name, '.js', '.cjs');`);
  },
  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`UPDATE "SequelizeMeta" SET name = REPLACE(name, '.cjs', '.js');`);
  },
}
