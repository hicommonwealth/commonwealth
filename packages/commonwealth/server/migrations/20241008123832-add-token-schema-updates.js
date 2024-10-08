'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Tokens',
        'community_id',
        {
          type: Sequelize.STRING,
          allowNull: false,
          references: { model: 'Communities', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction: t },
      );

      await queryInterface.addConstraint('Tokens', {
        type: 'foreign key',
        fields: ['community_id'],
        name: 'fk_Tokens_community_id',
        references: {
          table: 'Communities',
          fields: ['id'],
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        transaction: t,
      });

      await queryInterface.addColumn(
        'Tokens',
        'launchpad_contract_address',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction: t },
      );

      await queryInterface.addColumn(
        'Tokens',
        'uniswap_pool_address',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeConstraint(
        'Tokens',
        'fk_Tokens_community_id',
        { transaction: t },
      );
      queryInterface.removeColumn('Tokens', 'community_id', { transaction: t });
      queryInterface.removeColumn('Tokens', 'launchpad_contract_address', {
        transaction: t,
      });
      queryInterface.removeColumn('Tokens', 'uniswap_pool_address', {
        transaction: t,
      });
    });
  },
};
