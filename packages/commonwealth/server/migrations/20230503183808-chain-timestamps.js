'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Add altering commands here.
      await queryInterface.addColumn(
        'Chains',
        'created_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'Chains',
        'updated_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction }
      );

      const updateQuery = `
        UPDATE "Chains" AS c
        SET created_at = a.created_at
        FROM (
          SELECT chain, MIN(created_at) AS created_at
          FROM "Addresses"
          GROUP BY chain
        ) AS a
        WHERE c.created_at IS NULL AND c.id = a.chain;
      `;

      await queryInterface.sequelize.query(updateQuery, { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Add reverting commands here.
      await queryInterface.removeColumn('Chains', 'created_at', {
        transaction,
      });
      await queryInterface.removeColumn('Chains', 'updated_at', {
        transaction,
      });
    });
  },
};
