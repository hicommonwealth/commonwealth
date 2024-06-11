'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('OffchainReactions', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        chain: { type: Sequelize.STRING, allowNull: false },
        object_id: { type: Sequelize.STRING, allowNull: false },
        address_id: { type: Sequelize.INTEGER, allowNull: false },
        reaction: { type: Sequelize.STRING, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      })
      .then(async () => {
        await queryInterface.addIndex('OffchainReactions', { fields: ['id'] });
        await queryInterface.addIndex('OffchainReactions', {
          fields: ['chain', 'object_id'],
        });
        await queryInterface.addIndex('OffchainReactions', {
          fields: ['address_id'],
        });
        await queryInterface.addIndex('OffchainReactions', {
          fields: ['chain', 'address_id', 'object_id', 'reaction'],
          unique: true,
        });
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('OffchainReactions');
  },
};
