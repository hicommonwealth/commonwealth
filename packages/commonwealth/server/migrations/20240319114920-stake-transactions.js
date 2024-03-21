'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface
      .createTable(
        'StakeTransactions',
        {
          transaction_hash: {
            type: Sequelize.STRING,
            primaryKey: true,
          },
          community_id: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          stake_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          address: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          stake_amount: { type: Sequelize.INTEGER, allowNull: false },
          stake_price: { type: Sequelize.STRING, allowNull: false },
          stake_direction: {
            type: Sequelize.ENUM('buy', 'sell'),
            default: false,
            allowNull: false,
          },
          timestamp: { type: Sequelize.BIGINT, allowNull: false },
        },
        {
          indexes: [{ fields: ['address'] }, { fields: ['community_id'] }],
        },
      )
      .then(() => {
        return queryInterface.addConstraint('StakeTransactions', {
          type: 'foreign key',
          fields: ['stake_id', 'community_id'],
          name: 'fk_stake_transactions_community_stakes',
          references: {
            table: 'CommunityStakes',
            fields: ['stake_id', 'community_id'],
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        });
      });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('StakeTransactions');
  },
};
