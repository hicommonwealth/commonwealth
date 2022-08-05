'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
        CREATE table "ChainEntityMeta" as (SELECT id, title, chain, author, thread_id from "ChainEntities");
    `);
    await queryInterface.sequelize.query(`
        ALTER TABLE "ChainEntityMeta"
            ADD CONSTRAINT "ChainEntityMeta_thread_id_fkey"
                FOREIGN KEY (thread_id) REFERENCES "Threads";
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "ChainEntityMeta"
        ADD CONSTRAINT "ChainEntityMeta_chain_fkey"
            FOREIGN KEY (chain) REFERENCES "Chains";
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "ChainEntityMeta" ALTER COLUMN id SET NOT NULL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('ChainEntityMeta');
  }
};
