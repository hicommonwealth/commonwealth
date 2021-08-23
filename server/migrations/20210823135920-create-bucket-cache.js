'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('BucketCache', {
      name: { type: Sequelize.STRING, primaryKey: true },
      ipns: { type: Sequelize.STRING, allowNull: false },
      ipfs: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('BucketCache');
  }
};

