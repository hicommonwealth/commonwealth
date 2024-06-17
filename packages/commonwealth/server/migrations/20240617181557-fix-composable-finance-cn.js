'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      let res = await queryInterface.sequelize.query(
        `
          SELECT id
          FROM "ChainNodes"
          WHERE cosmos_chain_id = 'composable';
      `,
        { transaction, type: 'SELECT', raw: true },
      );

      if (!res.length) {
        await queryInterface.bulkInsert(
          'ChainNodes',
          [
            {
              url: 'https://rpc-composable-ia.cosmosia.notional.ventures',
              balance_type: 'cosmos',
              name: 'Composable Finance',
              cosmos_chain_id: 'composable',
            },
          ],
          { transaction },
        );

        res = await queryInterface.sequelize.query(
          `
          SELECT id
          FROM "ChainNodes"
          WHERE cosmos_chain_id = 'composable';
      `,
          { transaction, type: 'SELECT', raw: true },
        );
      }

      await queryInterface.bulkUpdate(
        'Communities',
        {
          chain_node_id: res[0].id,
        },
        {
          id: 'composable-finance',
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'Communities',
      {
        chain_node_id: null,
      },
      {
        id: 'composable-finance',
      },
    );
  },
};
