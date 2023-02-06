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

    return await queryInterface.renameColumn(
      'Threads',
      'last_commented_on',
      'latest_activity'
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(
      'Threads',
      'latest_activity',
      'last_commented_on'
    );

    return await queryInterface.changeColumn('Threads', 'last_commented_on', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
};
