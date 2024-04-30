'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `
          UPDATE "ChainNodes" SET url = 'https://phoenix-lcd.terra.dev' WHERE
          id = (SELECT chain_node_id FROM "Chains" WHERE id = 'terra');
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
          UPDATE "ChainNodes" SET url = 'https://lcd.phoenix.terra.setten.io/5e351408cfc5460186aa77ff1f38fac9' WHERE
          id = (SELECT chain_node_id FROM "Chains" WHERE id = 'terra');
      `,
      {
        raw: true,
        type: 'RAW',
      }
    );
  },
};
