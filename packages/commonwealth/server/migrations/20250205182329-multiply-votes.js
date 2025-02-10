'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        UPDATE "ContestActions"
        SET "calculated_voting_weight" = "calculated_voting_weight" * 1e18
        WHERE "calculated_voting_weight" > 0;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Reactions"
        SET "calculated_voting_weight" = "calculated_voting_weight" * 1e18
        WHERE "calculated_voting_weight" > 0;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Threads"
        SET "reaction_weights_sum" = "reaction_weights_sum" * 1e18
        WHERE "reaction_weights_sum" > 0;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Comments"
        SET "reaction_weights_sum" = "reaction_weights_sum" * 1e18
        WHERE "reaction_weights_sum" > 0;
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
        SET "calculated_voting_weight" = "calculated_voting_weight" / 1e18
        WHERE "calculated_voting_weight" > 0;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Reactions"
        SET "calculated_voting_weight" = "calculated_voting_weight" / 1e18
        WHERE "calculated_voting_weight" > 0;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Threads"
        SET "reaction_weights_sum" = "reaction_weights_sum" / 1e18
        WHERE "reaction_weights_sum" > 0;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Comments"
        SET "reaction_weights_sum" = "reaction_weights_sum" / 1e18
        WHERE "reaction_weights_sum" > 0;
        `,
        { transaction },
      );
    });
  },
};
