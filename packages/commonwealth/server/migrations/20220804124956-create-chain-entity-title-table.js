'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
        CREATE table "ChainEntityMeta" as (SELECT id, title from "ChainEntities");
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "ChainEntityMeta" ALTER COLUMN id SET NOT NULL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('ChainEntityMeta');
  }
};
