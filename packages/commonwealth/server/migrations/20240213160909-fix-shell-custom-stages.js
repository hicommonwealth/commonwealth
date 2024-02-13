'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
    UPDATE "Communities"
    SET custom_stages = CONCAT((SELECT SUBSTR(custom_stages, 1, length(custom_stages) - 1)), ']')
    WHERE id = 'shell-protocol';
   `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
    UPDATE "Communities"
    SET custom_stages = CONCAT((SELECT SUBSTR(custom_stages, 1, length(custom_stages) - 1)), '}')
    WHERE id = 'shell-protocol';
   `);
  },
};
