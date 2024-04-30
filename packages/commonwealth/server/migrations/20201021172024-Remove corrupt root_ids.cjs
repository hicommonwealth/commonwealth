'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    const query = `DELETE FROM "OffchainComments" WHERE root_id LIKE 'discussion_0x%';`;
    return queryInterface.sequelize.query(query);
  },

  down: (queryInterface, Sequelize) => {
    return;
  },
};
