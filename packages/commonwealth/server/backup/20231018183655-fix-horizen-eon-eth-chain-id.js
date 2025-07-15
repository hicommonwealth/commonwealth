'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `
      UPDATE "ChainNodes"
      SET eth_chain_id = 7332
      WHERE name = 'Horizen EON';
      `,
      { raw: true }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `
      UPDATE "ChainNodes"
      SET eth_chain_id = NULL
      WHERE name = 'Horizen EON';
      `,
      { raw: true }
    );
  },
};
