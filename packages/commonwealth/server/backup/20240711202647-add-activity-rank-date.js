'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Threads', 'activity_rank_date', {
        type: Sequelize.DATE,
        allowNull: true,
        transaction,
      });

      await queryInterface.sequelize.query(
        `
        CREATE INDEX IF NOT EXISTS threads_activity_rank_date ON "Threads" (activity_rank_date DESC NULLS LAST);
      `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Threads', 'activity_rank_date');
  },
};
