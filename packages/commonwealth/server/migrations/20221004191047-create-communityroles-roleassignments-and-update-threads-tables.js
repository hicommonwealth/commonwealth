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
            type: Sequelize.BIGINT,
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
          deleted_at: { type: Sequelize.DATE, allowNull: true },
        },
        { transaction: t }
      );
    });

    await queryInterface.sequelize.transaction(async (t) => {
      // Delete Roles that are associated with chains that no longer exist
      await queryInterface.sequelize.query(
        `DELETE FROM "Roles" WHERE "chain_id" NOT IN (SELECT "id" FROM "Chains")`,
        { transaction: t }
      );
    });

    await queryInterface.sequelize.transaction(async (t) => {
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
    });

    await queryInterface.sequelize.transaction(async (t) => {
      // Migrate RoleAssignments for Current Roles
      const role_query = `
      SELECT r.id as rid, cr.name as crname, r.address_id, r.permission, r.chain_id, cr.id as crid
      FROM "Roles" r
      LEFT JOIN "CommunityRoles" cr
      ON cr.chain_id = r.chain_id AND CAST(r.permission AS TEXT) = CAST(cr.name AS TEXT);`;
      const rolesWithCommunityRoles = await queryInterface.sequelize.query(
        role_query,
        {
          transaction: t,
        }
      );
      await Promise.all(
        rolesWithCommunityRoles[0].map(async (r) => {
          // create CommunityRoles for each chain
          console.log(`Creating RoleAssignment for role ${r.rid} with address ${r.address_id}`);
          await queryInterface.bulkInsert(
            'RoleAssignments',
            [
              {
                community_role_id: r.crid,
                address_id: r.address_id,
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
            { transaction: t }
          );
        })
      );
    });

    // Add indexes
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addIndex(
        'CommunityRoles',
        { fields: ['chain_id'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'RoleAssignments',
        { fields: ['community_role_id'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'RoleAssignments',
        { fields: ['address_id'] },
        { transaction: t }
      );
    });

    return new Promise((resolve, reject) => {
      resolve();
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('RoleAssignments', { transaction: t });
      await queryInterface.dropTable('CommunityRoles', { transaction: t });
    });
  },
};
