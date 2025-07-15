'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE "Contests"
      SET "score" = (
        SELECT jsonb_agg(
          jsonb_set(
            elem,
            '{votes}',
            to_jsonb((elem->>'votes')::numeric::text)
          )
        )
        FROM jsonb_array_elements("Contests"."score") as elem
      )
      WHERE "score" IS NOT NULL;
    `);
  },

  async down(queryInterface, Sequelize) {},
};
