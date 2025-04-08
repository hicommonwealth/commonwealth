'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (t) => {
      // Drop the existing foreign key constraint
      await queryInterface.removeConstraint(
        'CommunityDirectoryTags',
        'fk_CommunityDirectoryTags_selected_community_id',
        { transaction: t },
      );

      // Add the new foreign key constraint with allowNull: true
      await queryInterface.addConstraint('CommunityDirectoryTags', {
        type: 'foreign key',
        fields: ['selected_community_id'],
        name: 'fk_CommunityDirectoryTags_selected_community_id',
        references: {
          table: 'Communities',
          field: 'id',
        },
        onDelete: 'CASCADE',
        allowNull: true,
        transaction: t,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (t) => {
      // Drop the modified foreign key constraint
      await queryInterface.removeConstraint(
        'CommunityDirectoryTags',
        'fk_CommunityDirectoryTags_selected_community_id',
        { transaction: t },
      );

      // Restore the original foreign key constraint
      await queryInterface.addConstraint('CommunityDirectoryTags', {
        type: 'foreign key',
        fields: ['selected_community_id'],
        name: 'fk_CommunityDirectoryTags_selected_community_id',
        references: {
          table: 'Communities',
          field: 'id',
        },
        onDelete: 'CASCADE',
        transaction: t,
      });
    });
  },
};
