'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      return queryInterface.createTable(
        'Tags',
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          name: { type: Sequelize.STRING, allowNull: false },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        {
          timestamps: true,
          transactions: t,
        },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Tags');
  },
};
