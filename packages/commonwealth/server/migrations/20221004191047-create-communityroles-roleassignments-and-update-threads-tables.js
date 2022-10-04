'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        'CommunityRoles',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          chain_id: {
            type: Sequelize.STRING,
            allowNull: false,
            references: { model: 'Chains', key: 'id' },
          },
          name: {
            type: Sequelize.ENUM,
            values: ['admin', 'moderator', 'member'],
            defaultValue: 'member',
            allowNull: false,
          },
          permissions: {
            type: Sequelize.BIGINTEGER,
            defaultValue: 0,
            allowNull: false,
          },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction: t }
      );

      await queryInterface.createTable(
        'RoleAssignments',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          community_role_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'CommunityRoles', key: 'id' },
          },
          address_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'Addresses', key: 'id' },
          },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
          deleted_at: Sequelize.DATE,
        },
        { transaction: t }
      );

      
    });
    // Add indexes
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addIndex(
        'CommunityRoles',
        { fields: ['chain_id'] },
        { transaction: t }
      );
    });

    return new Promise((resolve, reject) => {
      resolve();
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
