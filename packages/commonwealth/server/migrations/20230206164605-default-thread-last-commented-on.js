'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
UPDATE "Threads" SET last_commented_on=created_at WHERE last_commented_on is NULL`);

    await queryInterface.changeColumn('Threads', 'last_commented_on', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.resolve();
  },
};
