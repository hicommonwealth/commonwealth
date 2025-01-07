'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'ContestManagers',
        'farcaster_frame_url',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'ContestManagers',
        'farcaster_frame_hashes',
        {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: true,
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(
        'ContestManagers',
        'farcaster_frame_url',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn(
        'ContestManagers',
        'farcaster_frame_hashes',
        {
          transaction,
        },
      );
    });
  },
};
