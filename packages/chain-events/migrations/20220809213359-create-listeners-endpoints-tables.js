'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE "ChainEndpoints" (
        id SERIAL PRIMARY KEY,
        url varchar(255) UNIQUE NOT NULL
      );
    `, {type: 'RAW'});

    await queryInterface.sequelize.query(`
      CREATE TABLE "Listeners"
      (
        id               SERIAL PRIMARY KEY,
        chain_id         varchar(255),
        spec             JSONB,
        contract_address varchar(255) UNIQUE,
        network          varchar(255) NOT NULL,
        base             varchar(255) NOT NULL,
        url_id           INTEGER      NOT NULL,
        verbose_logging  bool DEFAULT False,
        active           bool DEFAULT False,
        FOREIGN KEY (url_id) REFERENCES "ChainEndpoints" ON DELETE CASCADE ON UPDATE NO ACTION,
        FOREIGN KEY (chain_id) REFERENCES "Chains" ON DELETE CASCADE ON UPDATE CASCADE
      );
    `, {type: 'RAW'});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("ChainEndpoints");
    await queryInterface.dropTable("Listeners");
  }
};
