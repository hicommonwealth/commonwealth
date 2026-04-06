'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `
      ALTER TABLE "NftSnapshot" ALTER COLUMN "created_at" SET NOT NULL;
      ALTER TABLE "NftSnapshot" ALTER COLUMN "updated_at" SET NOT NULL;
     `,
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `
      ALTER TABLE "NftSnapshot" ALTER COLUMN "created_at" DROP NOT NULL;
      ALTER TABLE "NftSnapshot" ALTER COLUMN "updated_at" DROP NOT NULL;
     `,
    );
  },
};
