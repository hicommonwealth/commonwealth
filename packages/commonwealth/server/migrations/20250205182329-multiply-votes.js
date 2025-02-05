'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        UPDATE "ContestActions"
        SET "calculated_voting_weight" = "calculated_voting_weight" * 1e18;
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Reactions"
        SET "calculated_voting_weight" = "calculated_voting_weight" * 1e18;
      `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        UPDATE "ContestActions"
        SET "calculated_voting_weight" = "calculated_voting_weight" / 1e18;
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Reactions"
        SET "calculated_voting_weight" = "calculated_voting_weight" / 1e18;
      `,
        { transaction },
      );
    });
  },
};
