'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        'CommunityDirectoryTags',
        {
          community_id: {
            type: Sequelize.STRING,
            primaryKey: true,
            allowNull: false,
          },
          tag_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: true,
          },
          selected_community_id: {
            type: Sequelize.STRING,
            primaryKey: true,
            allowNull: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        {
          timestamps: true,
          transactions: t,
        },
      );

      await queryInterface.addConstraint('CommunityDirectoryTags', {
        type: 'foreign key',
        fields: ['community_id'],
        name: 'fk_CommunityDirectoryTags_community_id',
        references: {
          table: 'Communities',
          fields: ['id'],
        },
        onDelete: 'CASCADE',
        transaction: t,
      });

      await queryInterface.addConstraint('CommunityDirectoryTags', {
        type: 'foreign key',
        fields: ['tag_id'],
        name: 'fk_CommunityDirectoryTags_tag_id',
        references: {
          table: 'Tags',
          fields: ['id'],
        },
        onDelete: 'CASCADE',
        transaction: t,
      });

      await queryInterface.addConstraint('CommunityDirectoryTags', {
        type: 'foreign key',
        fields: ['selected_community_id'],
        name: 'fk_CommunityDirectoryTags_selected_community_id',
        references: {
          table: 'Communities',
          fields: ['id'],
        },
        onDelete: 'CASCADE',
        transaction: t,
      });

      await queryInterface.addIndex(
        'CommunityDirectoryTags',
        ['community_id'],
        {
          transaction: t,
        },
      );

      await queryInterface.addIndex('CommunityDirectoryTags', ['tag_id'], {
        transaction: t,
      });

      await queryInterface.addIndex(
        'CommunityDirectoryTags',
        ['selected_community_id'],
        {
          transaction: t,
        },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeIndex(
        'CommunityDirectoryTags',
        ['selected_community_id'],
        {
          transaction: t,
        },
      );
      await queryInterface.removeIndex('CommunityDirectoryTags', ['tag_id'], {
        transaction: t,
      });
      await queryInterface.removeIndex(
        'CommunityDirectoryTags',
        ['community_id'],
        {
          transaction: t,
        },
      );
      await queryInterface.removeConstraint(
        'CommunityDirectoryTags',
        'fk_CommunityDirectoryTags_selected_community_id',
        { transaction: t },
      );
      await queryInterface.removeConstraint(
        'CommunityDirectoryTags',
        'fk_CommunityDirectoryTags_tag_id',
        { transaction: t },
      );
      await queryInterface.removeConstraint(
        'CommunityDirectoryTags',
        'fk_CommunityDirectoryTags_community_id',
        { transaction: t },
      );
      await queryInterface.dropTable('CommunityDirectoryTags', {
        transaction: t,
      });
    });
  },
};
