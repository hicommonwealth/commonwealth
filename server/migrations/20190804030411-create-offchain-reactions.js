'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('OffchainReactions', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      chain: { type: DataTypes.STRING, allowNull: false },
      object_id: { type: DataTypes.STRING, allowNull: false },
      address_id: { type: DataTypes.INTEGER, allowNull: false },
      reaction: { type: DataTypes.STRING, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    }).then(async () => {

      await queryInterface.addIndex('OffchainReactions', { fields: ['id'] });
      await queryInterface.addIndex('OffchainReactions', { fields: ['chain', 'object_id'] });
      await queryInterface.addIndex('OffchainReactions', { fields: ['address_id'] });
      await queryInterface.addIndex('OffchainReactions', {
        fields: ['chain', 'address_id', 'object_id', 'reaction'],
        unique: true
      });
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('OffchainReactions');
  }
};
