module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // add the new column
      await queryInterface.addColumn(
        'ChainEventTypes',
        'event_network',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );

      // update all types
      await queryInterface.sequelize.query(
        'UPDATE "ChainEventTypes" SET event_network=\'substrate\' WHERE chain IN (SELECT id FROM "Chains" WHERE base = \'substrate\');',
        {
          type: queryInterface.sequelize.QueryTypes.UPDATE,
          transaction: t,
        }
      );

      for (const n of ['compound', 'aave', 'erc20', 'moloch']) {
        await queryInterface.sequelize.query(
          'UPDATE "ChainEventTypes" SET event_network=:n WHERE chain IN (SELECT id FROM "Chains" WHERE network = :n);',
          {
            replacements: { n },
            type: queryInterface.sequelize.QueryTypes.UPDATE,
            transaction: t,
          }
        );
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ChainEventTypes', 'event_network');
  },
};
