'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // First, create a temporary column to store the parsed arrays
      await queryInterface.addColumn(
        'Polls',
        'options_array',
        {
          type: Sequelize.ARRAY(Sequelize.STRING),
        },
        {
          transaction,
        },
      );

      // Parse the JSON strings and store them in the new column
      await queryInterface.sequelize.query(
        `
          UPDATE "Polls"
          SET options_array = ARRAY(SELECT jsonb_array_elements_text(options::jsonb));
        `,
        { transaction },
      );

      await queryInterface.removeColumn('Polls', 'options', { transaction });
      await queryInterface.renameColumn('Polls', 'options_array', 'options', {
        transaction,
      });

      await queryInterface.addColumn(
        'Votes',
        'user_id',
        {
          type: Sequelize.INTEGER,
        },
        {
          transaction,
        },
      );
      await queryInterface.sequelize.query(
        `
          UPDATE "Votes" V
          SET user_id = A.user_id
          FROM "Addresses" A
          WHERE A.address = V.address
        `,
        { transaction },
      );
      // remove duplicates by keeping only one vote per poll_id and address + poll_id
      await queryInterface.sequelize.query(
        `
          WITH ranked_votes AS (SELECT id,
                                       poll_id,
                                       address,
                                       ROW_NUMBER() OVER (PARTITION BY poll_id, address ORDER BY id) as rn
                                FROM "Votes"
                                WHERE user_id IS NOT NULL)
          DELETE
          FROM "Votes"
          WHERE user_id IS NOT NULL
            AND id IN (SELECT id
                       FROM ranked_votes
                       WHERE rn > 1);
        `,
        { transaction },
      );

      await queryInterface.addIndex('Votes', ['poll_id', 'address'], {
        unique: true,
        transaction,
      });

      // Enforce NOT NULL user_id for new records only
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Votes"
            ADD CONSTRAINT votes_user_id_not_null
              CHECK (user_id IS NOT NULL)
              NOT VALID;
        `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {},
};
