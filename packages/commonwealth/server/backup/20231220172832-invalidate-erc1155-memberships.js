'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const result = await queryInterface.sequelize.query(
        `
        SELECT id
        FROM "Groups" G,
             jsonb_array_elements(requirements::JSONB) AS elem
        WHERE elem -> 'data' -> 'source' ->> 'source_type' = 'erc1155';
      `,
        { type: 'SELECT', transaction },
      );

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await queryInterface.bulkUpdate(
        'Memberships',
        {
          last_checked: yesterday,
        },
        {
          group_id: result.map((g) => g.id),
        },
        {
          transaction,
        },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    // not possible
  },
};
