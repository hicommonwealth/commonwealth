'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('OffchainThreads', 'topic_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('OffchainThreads', 'topic_id', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  }
};
