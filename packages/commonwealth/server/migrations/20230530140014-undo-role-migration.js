'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Addresses',
        'is_user_default',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Addresses',
        'role',
        {
          type: Sequelize.ENUM('member', 'moderator', 'admin'),
          allowNull: false,
          defaultValue: 'member',
        },
        { transaction: t }
      );

      // Add roles to Addresses from Roles table
      const roles = await queryInterface.sequelize.query(
        `SELECT address_id, permission FROM "Roles" WHERE permission != 'member'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction: t }
      );

      const ids = roles.map((r) => r.address_id);
      const permissions = roles.map((r) => r.permission);

      if (ids.length > 0) {
        // Make the update in one query, cast the permissions to the enum
        await queryInterface.sequelize.query(
          `
        UPDATE "Addresses"
        SET role = CASE 
            ${ids
              .map(
                (id, index) =>
                  `WHEN id = ${id} THEN '${permissions[index]}'::"enum_Addresses_role"`
              )
              .join(' ')}
        END
        WHERE id IN (${ids.join(', ')})
        `,
          { transaction: t }
        );

        // Add is_user_default to Addresses from RoleAssignments table
        const isUserDefault = await queryInterface.sequelize.query(
          `SELECT address_id, is_user_default FROM "RoleAssignments" WHERE is_user_default = true`,
          { type: queryInterface.sequelize.QueryTypes.SELECT, transaction: t }
        );

        const userDefaultIds = isUserDefault.map((r) => r.address_id);

        await queryInterface.sequelize.query(
          `
        UPDATE "Addresses"
        SET is_user_default = CASE 
            ${userDefaultIds.map((id) => `WHEN id = ${id} THEN true`).join(' ')}
        END
        WHERE id IN (${userDefaultIds.join(', ')})
        `,
          { transaction: t }
        );
      }

      // drop unused columns
      await queryInterface.removeColumn('Chains', 'default_allow_permissions', {
        transaction: t,
      });
      await queryInterface.removeColumn('Chains', 'default_deny_permissions', {
        transaction: t,
      });

      // drop unused tables
      await queryInterface.dropTable('RoleAssignments', { transaction: t });
      await queryInterface.dropTable('CommunityRoles', { transaction: t });
      await queryInterface.dropTable('Roles', { transaction: t });
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
