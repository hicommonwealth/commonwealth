'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('Events', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      origin: { type: DataTypes.STRING, allowNull: false },
      blocknum: { type: DataTypes.INTEGER, allowNull: false },
      timestamp: { type: DataTypes.STRING, allowNull: true },
      name: { type: DataTypes.STRING, allowNull: false },
      data: { type: DataTypes.TEXT, allowNull: true },
    }, {
      underscored: true,
      indexes: [
        { fields: ['origin', 'blocknum'] },
        { fields: ['origin', 'timestamp'] },
      ],
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('Events');
  }
};
