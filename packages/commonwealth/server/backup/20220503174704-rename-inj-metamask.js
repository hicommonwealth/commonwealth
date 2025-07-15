'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `
      UPDATE "Addresses" SET wallet_id = 'cosm-metamask'
      WHERE wallet_id = 'inj-metamask';
    `,
      {
        raw: true,
        type: 'RAW',
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `
      UPDATE "Addresses" SET wallet_id = 'inj-metamask'
      WHERE wallet_id = 'cosm-metamask';
    `,
      {
        raw: true,
        type: 'RAW',
      }
    );
  },
};
