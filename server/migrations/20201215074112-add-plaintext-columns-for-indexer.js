'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('OffchainThreads', 'plaintext', { type: Sequelize.TEXT, allowNull: true, }, {
        transaction: t
      });
      await queryInterface.addColumn('OffchainComments', 'plaintext', { type: Sequelize.TEXT, allowNull: true, }, {
        transaction: t
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('OffchainThreads', 'plaintext');
      await queryInterface.removeColumn('OffchainComments', 'plaintext');
    });
  }
};
