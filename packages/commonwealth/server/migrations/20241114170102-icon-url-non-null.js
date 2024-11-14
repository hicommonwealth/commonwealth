'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
              WITH random_avatars AS (
                  SELECT id, (ARRAY[
                     'https://assets.commonwealth.im/6588c98e-8c2f-4ba1-a312-0ebda16861b7.png', 
                     'https://assets.commonwealth.im/66422349-c5b2-4323-9f55-4750eaac5162.png', 
                     'https://assets.commonwealth.im/ea18afa6-158f-4fa2-b28b-1f51d88a1ad1.png', 
                     'https://assets.commonwealth.im/beaf8336-eb27-43e8-9d81-feaefcdb8db9.png',
                     'https://assets.commonwealth.im/5a2f2012-22a5-469e-9214-a0a2d84ecbef.png', 
                     'https://assets.commonwealth.im/128e3b82-fd5d-4f1d-bdcc-5e23336f299f.png',
                      ])[floor(random() * 6 + 1)] AS avatar_url
                  FROM "Communities"
                  WHERE 'icon_url' IS NULL
                     OR 'icon_url' = ''
              )
              UPDATE "Communities"
              SET icon_url = random_avatars.avatar_url
              FROM random_avatars
              WHERE "Communities".id = random_avatars.id
          `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
           ALTER TABLE "Communities"
           ALTER COLUMN "icon_url" SET NOT NULL;
          `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {},
};
