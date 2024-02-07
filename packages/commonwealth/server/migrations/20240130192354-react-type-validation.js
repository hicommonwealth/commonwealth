'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Update all existing reactions to 'like'
      await queryInterface.sequelize.query(
        `UPDATE "Reactions" SET "reaction" = 'like';`,
        { transaction },
      );
      // set column to enum type
      await queryInterface.changeColumn(
        'Reactions',
        'reaction',
        {
          type: Sequelize.ENUM('like'),
          allowNull: false,
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    // restore to varchar 255 type
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'Reactions',
        'reaction',
        {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'DROP TYPE "enum_Reactions_reaction";',
        { transaction },
      );
    });
  },
};
