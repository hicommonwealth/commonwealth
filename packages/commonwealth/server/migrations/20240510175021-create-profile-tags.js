'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        'ProfileTags',
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          profile_id: { type: Sequelize.INTEGER, allowNull: false },
          tag_id: { type: Sequelize.INTEGER, allowNull: false },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        {
          timestamps: true,
          transactions: t,
        },
      );

      await queryInterface.addConstraint('ProfileTags', {
        type: 'foreign key',
        fields: ['profile_id'],
        name: 'fk_ProfileTags_profile_id',
        references: {
          table: 'Profiles',
          fields: ['id'],
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        transaction: t,
      });

      await queryInterface.addConstraint('ProfileTags', {
        type: 'foreign key',
        fields: ['tag_id'],
        name: 'fk_ProfileTags_tag_id',
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
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint(
        'ProfileTags',
        'fk_ProfileTags_tag_id',
        { transaction },
      );
      await queryInterface.removeConstraint(
        'ProfileTags',
        'fk_ProfileTags_profile_id',
        { transaction },
      );
      await queryInterface.dropTable('ProfileTags', { transaction });
    });
  },
};
