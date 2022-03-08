'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DELETE FROM "ChainEvents" WHERE "ChainEvents".chain_event_type_id LIKE '%heartbeat-received';`);
  },

  down: (queryInterface, Sequelize) => {
    return new Promise((resolve) => resolve());
    // CANNOT REVERSE
  },
};
