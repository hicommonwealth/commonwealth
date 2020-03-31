'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('OffchainViewCounts', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
      chain: { type: DataTypes.STRING },
      community: { type: DataTypes.STRING },
      object_id: { type: DataTypes.INTEGER, allowNull: false },
      view_count: { type: DataTypes.INTEGER, allowNull: false },
    }, {
      underscored: true,
      timestamps: false,
      indexes: [
        {fields: ['id']},
        {fields: ['chain', 'object_id']},
        {fields: ['community', 'object_id']},
        {fields: ['chain', 'community', 'object_id']},
        {fields: ['view_count']},
      ],
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('OffchainViewCounts');
  }
};
