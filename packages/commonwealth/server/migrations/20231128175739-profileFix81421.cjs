'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE "Addresses"
         SET
           profile_id = 81421,
           user_id = (SELECT user_id FROM "Profiles" WHERE id = 81421)
         WHERE profile_id = 127667;`,
        {
          transaction,
        },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE "Addresses"
         SET
           profile_id = 127667,
           user_id = (SELECT user_id FROM "Profiles" WHERE id = 127667)
         WHERE profile_id = 81421;`,
        {
          transaction,
        },
      );
    });
  },
};
