'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const prohibitedChars = '["<>%{}|\\/^`]';
    const query = `UPDATE "OffchainTopics" SET name=REGEXP_REPLACE(name, '${prohibitedChars}', '', 'g');`;
    queryInterface.sequelize.query(query);
  },

  down: async (queryInterface, Sequelize) => {
    // Down not possible
  },
};
