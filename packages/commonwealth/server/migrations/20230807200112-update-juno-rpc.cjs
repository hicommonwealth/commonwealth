'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `
      UPDATE "ChainNodes"
      SET url = 'https://rpc-juno.ecostake.com'
      WHERE url = 'https://rpc-juno.itastakers.com';
      `,
      { raw: true }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `
      UPDATE "ChainNodes"
      SET url = 'https://rpc-juno.itastakers.com'
      WHERE url = 'https://rpc-juno.ecostake.com';
      `,
      { raw: true }
    );
  },
};
