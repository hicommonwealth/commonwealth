'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface
      .createTable(
        'StakeTransactions',
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
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
          address_id: {
            type: Sequelize.INTEGER,
            references: {
              model: 'Addresses',
              key: 'id',
            },
            allowNull: false,
          },
          stake_price: { type: Sequelize.STRING, allowNull: false },
          stake_direction: {
            type: Sequelize.ENUM('buy', 'sell'),
            default: false,
            allowNull: false,
          },
          created_at: { type: Sequelize.DATE, allowNull: false },
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
