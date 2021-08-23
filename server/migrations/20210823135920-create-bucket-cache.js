'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('BucketCache', {
      name: { type: Sequelize.STRING, primaryKey: true },
      ipns_cid: { type: Sequelize.STRING, allowNull: false },
      ipfs_cid: { type: Sequelize.STRING, allowNull: false },
      thread_link: { type: Sequelize.STRING, allowNull: false },
      ipns_link: { type: Sequelize.STRING, allowNull: false },
      bucket_website: { type: Sequelize.STRING, allowNull: false },
      encrypted: { type: Sequelize.BOOLEAN, allowNull: false},
      token: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('BucketCache');
  }
};

