'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // DELETE DEPOSIT AND VOTE EVENTS FOR COSMOS CHAINS
    await queryInterface.sequelize.query(
      `
        DELETE FROM "ChainEvents" WHERE chain_event_type_id LIKE '%msg-deposit%' OR chain_event_type_id LIKE '%msg-vote%'
      `
    );
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * NOT REVERSIBLE => RUN STORAGE FETCHER / MIGRATION IF NEEDED
     */
  },
};
