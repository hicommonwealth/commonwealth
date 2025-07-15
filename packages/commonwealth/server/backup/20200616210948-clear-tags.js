'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
DELETE FROM "OffchainTags" WHERE community_id != 'internal' OR community_id IS NULL
`);
  },

  down: (queryInterface, Sequelize) => {
    return new Promise((resolve, reject) => resolve());
  },
};
