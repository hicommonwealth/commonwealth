'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Chains',
        'bech32_prefix',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { bech32_prefix: 'cosmos' },
        { id: 'cosmos' },
        { transaction }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { bech32_prefix: 'str' },
        { id: 'straightedge' },
        { transaction }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { bech32_prefix: 'osmo' },
        { id: 'osmosis' },
        { transaction }
      );
      await queryInterface.bulkUpdate(
        'Chains',
        { bech32_prefix: 'inj' },
        { id: 'injective' },
        { transaction }
      );
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('Chains', 'bech32_prefix');
  },
};
