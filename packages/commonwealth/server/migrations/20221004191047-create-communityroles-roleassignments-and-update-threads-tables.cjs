'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return queryInterface.sequelize.transaction(async (t) => {
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
          allow: {
            type: Sequelize.BIGINT,
            defaultValue: 0,
            allowNull: false,
          },
          deny: {
            type: Sequelize.BIGINT,
            defaultValue: 0,
            allowNull: false,
          },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        {
          underscored: true,
          indexes: [
            { fields: ['chain_id'] },
            { fields: ['community_role_id'] },
            { fields: ['address_id'] },
          ],
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
          deleted_at: { type: Sequelize.DATE, allowNull: true },
          is_user_default: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
        },
        { transaction: t }
      );

      // Migrate CommunityRoles for Current Chains
      const query = `
      SELECT c.id as cid
      FROM "Chains" c;`;
      const chains = await queryInterface.sequelize.query(query, {
        transaction: t,
      });
      await Promise.all(
        chains[0].map(async (c) => {
          // create CommunityRoles for each chain
          await queryInterface.bulkInsert(
            'CommunityRoles',
            [
              {
                chain_id: c.cid,
                name: 'admin',
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
            { transaction: t }
          );
          await queryInterface.bulkInsert(
            'CommunityRoles',
            [
              {
                chain_id: c.cid,
                name: 'moderator',
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
            { transaction: t }
          );
          await queryInterface.bulkInsert(
            'CommunityRoles',
            [
              {
                chain_id: c.cid,
                name: 'member',
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
            { transaction: t }
          );
        })
      );

      // I think we need to do it half and half
      // Migrate RoleAssignments for Current Roles
      const role_query = `
      SELECT r.id as rid, cr.name as crname, r.address_id, r.permission, r.chain_id, r.is_user_default, cr.id as crid
      FROM "Roles" r
      LEFT JOIN "CommunityRoles" cr
      ON r.chain_id = cr.chain_id AND CAST(r.permission AS TEXT) = CAST(cr.name AS TEXT)
      WHERE r.chain_id IN (SELECT "id" FROM "Chains") AND r.address_id IN (SELECT "id" FROM "Addresses");`;
      const rolesWithCommunityRoles = await queryInterface.sequelize.query(
        role_query,
        {
          transaction: t,
        }
      );
      await Promise.all(
        rolesWithCommunityRoles[0].map(async (r) => {
          // create CommunityRoles for each chain
          await queryInterface.bulkInsert(
            'RoleAssignments',
            [
              {
                community_role_id: r.crid,
                address_id: r.address_id,
                created_at: new Date(),
                updated_at: new Date(),
                is_user_default: r.is_user_default,
              },
            ],
            { transaction: t }
          );
        })
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('RoleAssignments', { transaction: t });
      await queryInterface.dropTable('CommunityRoles', { transaction: t });
    });
  },
};
