'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ThreadTokens', 'thread_id');
    await queryInterface.addColumn('ThreadTokens', 'thread_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Threads',
        key: 'id',
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('ThreadTokens', 'thread_id', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
