'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
        CREATE table "ChainEntityTitles" as (SELECT id, title from "ChainEntities");
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "ChainEntityTitles" ADD PRIMARY KEY (id);
    `);
    await queryInterface.sequelize.query(`
      CREATE SEQUENCE ChainEntityTitles_id_seq OWNED BY "ChainEntityTitles".id;
    `);
    await queryInterface.sequelize.query(`
        ALTER TABLE "ChainEntityTitles" 
        ALTER id SET DEFAULT nextval('ChainEntityTitles_id_seq'::regclass);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('ChainEntityTitles');
  }
};
