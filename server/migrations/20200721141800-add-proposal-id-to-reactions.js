'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'OffchainReactions',
        'proposal_id',
        {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true,
          references: {
            model: 'Proposals',
            key: 'identifier',
          }
        },
        { transaction: t }
      );
      await queryInterface.removeIndex(
        'Proposals', {
          fields: ['chain', 'address_id', 'thread_id', 'comment_id', 'reaction'],
          unique: true
        },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'Proposals', {
          fields: ['chain', 'address_id', 'thread_id', 'proposal_id', 'comment_id', 'reaction'],
          unique: true
        },
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColum(
        'OffchainReactions',
        'proposal_id',
        {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true,
          references: {
            model: 'Proposals',
            key: 'identifier'
          }
        }
      );
    });
  }
};
