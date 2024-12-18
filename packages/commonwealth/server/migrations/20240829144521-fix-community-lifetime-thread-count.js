'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
          Update "Communities" c 
          SET lifetime_thread_count = (
            SELECT Count(*) FROM "Threads" t WHERE t.community_id = c.id AND t.deleted_at IS NULL
          );
       `,
        {
          transaction,
        },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Irreversible
     */
  },
};
