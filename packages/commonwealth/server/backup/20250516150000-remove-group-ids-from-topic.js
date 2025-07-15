'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    try {
      await queryInterface.sequelize.transaction(async (transaction) => {
        await queryInterface.removeColumn('Topics', 'group_ids', {
          transaction,
        });
      });
    } catch {
      // ignore
    }
  },

  async down() {},
};
