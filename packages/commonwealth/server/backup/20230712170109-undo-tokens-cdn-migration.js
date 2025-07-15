'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `UPDATE "Tokens" SET icon_url = 
     regexp_replace("icon_url", 'https://assets.commonwealth.im/(.*)', 'https://roll-token.s3.amazonaws.com/\\1')`
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `UPDATE "Tokens" SET icon_url = 
     regexp_replace("icon_url", 'https://roll-token.s3.amazonaws.com/\\1', 'https://assets.commonwealth.im/(.*)')`
    );
  },
};
