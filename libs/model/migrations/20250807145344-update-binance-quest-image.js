'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        UPDATE "Quests" 
        SET "image_url" = 'https://s3.us-east-1.amazonaws.com/assets.commonwealth.im/d15d1227-87ec-4168-9549-60c3ba6f4881.png'
        WHERE id = -4;
        `,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        UPDATE "Quests" 
        SET "image_url" = 'https://assets.commonwealth.im/2bbf06e5-600a-4a49-a4d9-711237d79696.png'
        WHERE id = -4;
        `,
        { transaction },
      );
    });
  },
};
