'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('HedgehogAuthentications', {
      iv: { type: Sequelize.STRING, allowNull: false },
      cipherText: { type: Sequelize.STRING, allowNull: false },
      lookupKey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('HedgehogAuthentications');
  },
};
