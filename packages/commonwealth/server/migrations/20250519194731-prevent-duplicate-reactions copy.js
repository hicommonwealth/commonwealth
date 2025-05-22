'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        DELETE FROM "Reactions"
        WHERE id IN (
            SELECT id FROM (
                               SELECT id,
                                      RANK() OVER (PARTITION BY thread_id, address_id ORDER BY id) as rnk
                               FROM "Reactions"
                               WHERE thread_id IS NOT NULL
                           ) ranked
            WHERE rnk > 1
        );
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        DELETE FROM "Reactions"
        WHERE id IN (
            SELECT id FROM (
                               SELECT id,
                                      RANK() OVER (PARTITION BY comment_id, address_id ORDER BY id) as rnk
                               FROM "Reactions"
                               WHERE comment_id IS NOT NULL
                           ) ranked
            WHERE rnk > 1
        );
      `,
        { transaction },
      );
      await queryInterface.addIndex('Reactions', ['thread_id', 'address_id'], {
        unique: true,
        where: {
          thread_id: {
            [Sequelize.Op.ne]: null,
          },
        },
        transaction,
      });

      await queryInterface.addIndex('Reactions', ['comment_id', 'address_id'], {
        unique: true,
        where: {
          comment_id: {
            [Sequelize.Op.ne]: null,
          },
        },
        transaction,
      });
      await queryInterface.removeIndex('Reactions', ['thread_id'], {
        transaction,
      });
      await queryInterface.removeIndex('Reactions', ['comment_id'], {
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Remove unique indexes
      await queryInterface.removeIndex(
        'Reactions',
        ['thread_id', 'address_id'],
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        'Reactions',
        ['comment_id', 'address_id'],
        {
          transaction,
        },
      );

      // Add back original indexes
      await queryInterface.addIndex('Reactions', ['thread_id'], {
        transaction,
      });
      await queryInterface.addIndex('Reactions', ['comment_id'], {
        transaction,
      });
    });
  },
};
