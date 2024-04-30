'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'OffchainTopics',
        'featured_in_sidebar',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'OffchainTopics',
        'featured_in_new_post',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(
        'OffchainTopics',
        'featured_in_sidebar',
        { transaction: t }
      );
      await queryInterface.removeColumn(
        'OffchainTopics',
        'featured_in_new_post',
        { transaction: t }
      );
    });
  },
};
