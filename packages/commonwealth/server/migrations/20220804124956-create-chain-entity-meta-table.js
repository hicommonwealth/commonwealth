'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // copy the required columns to a new table
    await queryInterface.sequelize.query(`
        CREATE table "ChainEntityMeta" as (SELECT id, title, chain, author, thread_id from "ChainEntities");
    `);

    // copy the id column to ce_id and add NOT NULL and UNIQUE constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE "ChainEntityMeta" ADD COLUMN ce_id INTEGER UNIQUE;
    `);
    await queryInterface.sequelize.query(`
        UPDATE "ChainEntityMeta" SET ce_id = id;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "ChainEntityMeta" ALTER COLUMN ce_id SET NOT NULL;
    `);

    // set id column as an auto-increment primary key
    await queryInterface.sequelize.query(`
        ALTER TABLE "ChainEntityMeta" ADD PRIMARY KEY (id);
    `);
    await queryInterface.sequelize.query(`
        CREATE SEQUENCE ChainEntityMeta_id_seq OWNED BY "ChainEntityMeta".id;
    `);
    await queryInterface.sequelize.query(`
        ALTER TABLE "ChainEntityMeta" ALTER id SET DEFAULT nextval('ChainEntityMeta_id_seq'::regclass);
    `);

    // set the appropriate foreign keys
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
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('ChainEntityMeta');
  }
};
