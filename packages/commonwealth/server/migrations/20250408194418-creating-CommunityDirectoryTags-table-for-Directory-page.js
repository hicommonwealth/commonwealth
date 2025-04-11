'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CommunityDirectoryTags', {
      community_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Communities',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      tag_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Tags',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      selected_community_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'Communities',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add unique constraint to prevent duplicate combinations
    await queryInterface.addConstraint('CommunityDirectoryTags', {
      fields: ['community_id', 'tag_id', 'selected_community_id'],
      type: 'unique',
      name: 'unique_community_tag_selected',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CommunityDirectoryTags');
  },
};
