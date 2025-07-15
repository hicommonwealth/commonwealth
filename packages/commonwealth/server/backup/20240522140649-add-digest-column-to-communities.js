'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Communities',
        'include_in_digest_email',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addIndex(
        'Communities',
        ['include_in_digest_email'],
        {
          name: 'communities_include_in_digest_email',
          transaction,
        },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Communities', 'include_in_digest_email');
  },
};
