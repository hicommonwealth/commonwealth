'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const query = `UPDATE "OffchainTopics" SET name=REGEXP_REPLACE(name, '[^[:alpha:][:digit:][:space:]]', '', 'g');`;
    queryInterface.sequelize.query(query);
  },

  down: async (queryInterface, Sequelize) => {
    // Down not possible
  }
};
