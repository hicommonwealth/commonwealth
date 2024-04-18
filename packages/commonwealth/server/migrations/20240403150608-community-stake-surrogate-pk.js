'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeConstraint(
        'StakeTransactions',
        'fk_stake_transactions_community_stakes',
        { transaction: t },
      );

      await queryInterface.removeConstraint(
        'CommunityStakes',
        'CommunityStakes_pkey',
        { transaction: t },
      );

      await queryInterface.removeConstraint(
        'CommunityStakes',
        'CommunityStakes_community_id_fkey',
        { transaction: t },
      );

      await queryInterface.addColumn(
        'CommunityStakes',
        'id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        { transaction: t },
      );

      await queryInterface.addIndex('CommunityStakes', ['community_id'], {
        transaction: t,
      });
      await queryInterface.addIndex('CommunityStakes', ['stake_id'], {
        transaction: t,
      });

      await queryInterface.addConstraint('CommunityStakes', {
        fields: ['community_id'],
        type: 'foreign key',
        name: 'CommunityStake_community_id_fkey',
        references: {
          table: 'Communities',
          field: 'id',
        },
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
