'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // move orphaned threads from 'govgen' to 'atomone' community
    await queryInterface.sequelize.query(
      `UPDATE "Threads" SET "community_id" = 'atomone' WHERE "community_id" = 'govgen'`,
    );

    await queryInterface.addConstraint('Threads', {
      fields: ['community_id'],
      type: 'FOREIGN KEY',
      name: 'FK_Threads_Communities',
      references: {
        table: 'Communities',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('Threads', 'FK_Threads_Communities');
  },
};
