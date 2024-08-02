'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Comments" DROP COLUMN IF EXISTS community_id;
        ALTER TABLE "Reactions" DROP COLUMN IF EXISTS community_id;
        `,
        {
          transaction: t,
        },
      );
    });
  },

  async down() {
    await queryInterface.sequelize.transaction(async () => {
      // TODO
    });
  },
};
