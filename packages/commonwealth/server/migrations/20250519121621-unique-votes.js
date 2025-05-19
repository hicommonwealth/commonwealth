'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
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
      // remove duplicates by keeping only one vote per poll_id and address + poll_id and user_id combinations
      await queryInterface.sequelize.query(
        `
        WITH ranked_votes AS (
          SELECT id, poll_id, address, 
                 ROW_NUMBER() OVER (PARTITION BY poll_id, address ORDER BY id) as rn
          FROM "Votes"
          WHERE user_id IS NOT NULL
        )
        DELETE FROM "Votes"
        WHERE user_id IS NOT NULL AND id IN (
          SELECT id FROM ranked_votes WHERE rn > 1
        );
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        WITH ranked_votes AS (
          SELECT id, poll_id, user_id, 
                 ROW_NUMBER() OVER (PARTITION BY poll_id, user_id ORDER BY id) as rn
          FROM "Votes"
          WHERE user_id IS NOT NULL
        )
        DELETE FROM "Votes"
        WHERE user_id IS NOT NULL AND id IN (
          SELECT id FROM ranked_votes WHERE rn > 1
        );
      `,
        { transaction },
      );

      // Add unique index for votes that have a user
      await queryInterface.sequelize.query(
        `
        CREATE UNIQUE INDEX idx_unique_votes
        ON "Votes" (poll_id, user_id)
        WHERE user_id IS NOT NULL;
      `,
        { transaction },
      );
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

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('Votes', ['poll_id', 'user_id'], {
        unique: true,
        transaction,
      });
      await queryInterface.removeColumn('Votes', 'user_id', { transaction });
    });
  },
};
