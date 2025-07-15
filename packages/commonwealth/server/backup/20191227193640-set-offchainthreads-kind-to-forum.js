'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkUpdate('OffchainThreads', { kind: 'forum' });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkUpdate('OffchainThreads', { kind: '' });
  },
};
