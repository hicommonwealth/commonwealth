'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        'CommunityTags',
        {
          community_id: {
            type: Sequelize.STRING,
            primaryKey: true,
            allowNull: false,
          },
          tag_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
          },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        {
          timestamps: true,
          transactions: t,
        },
      );

      await queryInterface.addConstraint('CommunityTags', {
        type: 'foreign key',
        fields: ['community_id'],
        name: 'fk_CommunityTags_community_id',
        references: {
          table: 'Communities',
          fields: ['id'],
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        transaction: t,
      });

      await queryInterface.addConstraint('CommunityTags', {
        type: 'foreign key',
        fields: ['tag_id'],
        name: 'fk_CommunityTags_tag_id',
        references: {
          table: 'Tags',
          fields: ['id'],
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint(
        'CommunityTags',
        'fk_CommunityTags_tag_id',
        { transaction },
      );
      await queryInterface.removeConstraint(
        'CommunityTags',
        'fk_CommunityTags_community_id',
        { transaction },
      );
      await queryInterface.dropTable('CommunityTags', { transaction });
    });
  },
};
