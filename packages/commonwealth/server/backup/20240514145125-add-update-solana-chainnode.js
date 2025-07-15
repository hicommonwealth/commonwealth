'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const node = await queryInterface.sequelize.query(
        `SELECT * FROM "ChainNodes" WHERE name = 'Solana (Mainnet Beta)'`,
        { transaction },
      );

      if (node[0].length > 0) {
        await queryInterface.sequelize.query(
          `UPDATE "ChainNodes" SET url = 'https://solana-mainnet.g.alchemy.com/v2/hI2p21ABnG5VwZvYKorgEaVTeLA2N2rW', private_url = 'https://solana-mainnet.g.alchemy.com/v2/hI2p21ABnG5VwZvYKorgEaVTeLA2N2rW' WHERE name = 'Solana (Mainnet Beta)'`,
          { transaction },
        );
      } else {
        await queryInterface.bulkInsert(
          'ChainNodes',
          [
            {
              url: 'https://solana-mainnet.g.alchemy.com/v2/hI2p21ABnG5VwZvYKorgEaVTeLA2N2rW',
              private_url:
                'https://solana-mainnet.g.alchemy.com/v2/hI2p21ABnG5VwZvYKorgEaVTeLA2N2rW',
              balance_type: 'solana',
              name: 'Solana (Mainnet Beta)',
            },
          ],
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const node = await queryInterface.sequelize.query(
        `SELECT * FROM "ChainNodes" WHERE name = 'Solana (Mainnet Beta)'`,
        { transaction },
      );

      if (node[0].length > 0) {
        await queryInterface.sequelize.query(
          `UPDATE "ChainNodes" SET url = 'mainnet-beta', private_url = 'mainnet-beta' WHERE name = 'Solana Mainnet Beta'`,
          { transaction },
        );
      }
    });
  },
};
