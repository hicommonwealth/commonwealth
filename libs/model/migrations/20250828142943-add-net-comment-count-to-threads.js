'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Add the net_comment_count column with default value of 0
      await queryInterface.addColumn(
        'Threads',
        'net_comment_count',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction },
      );

      // Initialize net_comment_count with the current comment_count for all threads
      await queryInterface.sequelize.query(
        `
        UPDATE "Threads"
        SET net_comment_count = comment_count;
        `,
        { transaction },
      );

      console.log(
        'Added net_comment_count column and initialized with current comment_count values',
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Threads', 'net_comment_count');
  },
};
