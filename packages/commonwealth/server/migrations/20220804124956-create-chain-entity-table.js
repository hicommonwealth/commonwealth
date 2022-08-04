'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
        CREATE table "ChainEntityTitles" as (SELECT id, title from "ChainEntities");
    `, { raw: true });
    await queryInterface.sequelize.query(`
      ALTER TABLE "ChainEntityTitles" ADD PRIMARY KEY (id);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('ChainEntityTitles');
  }
};
