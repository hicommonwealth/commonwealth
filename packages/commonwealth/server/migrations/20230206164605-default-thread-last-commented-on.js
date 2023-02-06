'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
UPDATE "Threads" SET last_commented_on=created_at WHERE last_commented_on is NULL`);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.resolve();
  }
};
