'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        UPDATE
          "Communities"
        SET
          type = 'offchain',
          chain_node_id = (SELECT id FROM "ChainNodes" WHERE eth_chain_id = 1),
          network = 'ethereum'
        WHERE
          id = 'axie-infinity'
        ;
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        DELETE FROM
          "ChainNodes"
        WHERE
          eth_chain_id = 2020
        ;
      `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        INSERT INTO
          "ChainNodes"
          (
            url,
            eth_chain_id,
            alt_wallet_url,
            balance_type,
            name,
            created_at,
            updated_at
          )
        VALUES (
          'wss://ronin-rpc.commonwealth.im/wss',
          2020,
          'https://ronin-rpc.commonwealth.im',
          'axie-infinity',
          'Ronin',
          NOW(),
          NOW()
        );
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        UPDATE
          "Communities"
        SET
          type = 'token',
          chain_node_id = (SELECT id FROM "ChainNodes" WHERE eth_chain_id = 2020),
          network = 'axie-infinity'
        WHERE
          id = 'axie-infinity'
        ;
      `,
        { transaction },
      );
    });
  },
};
