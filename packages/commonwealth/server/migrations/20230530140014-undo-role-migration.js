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
        {
          transaction: t,
          isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
        }
      );
      await queryInterface.addColumn(
        'Addresses',
        'role',
        {
          type: Sequelize.ENUM('member', 'moderator', 'admin'),
          allowNull: false,
          defaultValue: 'member',
        },
        {
          transaction: t,
          isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
        }
      );

      // Add roles to Addresses from Roles table
      // Add is_user_default to Addresses from RoleAssignments table
      const roleInfo = await queryInterface.sequelize.query(
        `SELECT address_id, name, is_user_default FROM "RoleAssignments" as r
         JOIN "CommunityRoles" as c on c.id = r.community_role_id
         WHERE is_user_default = true OR name != 'member'`,
        {
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction: t,
          isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
        }
      );

      const roles = roleInfo.filter((r) => r.name !== 'member');

      const ids = roles.map((r) => r.address_id);
      const permissions = roles.map((r) => r.name);

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
          {
            transaction: t,
            isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
          }
        );

        const isUserDefault = roleInfo.filter((r) => r.is_user_default);

        const userDefaultIds = isUserDefault.map((r) => r.address_id);

        await queryInterface.sequelize.query(
          `
        UPDATE "Addresses"
        SET is_user_default = true
        WHERE id IN (${userDefaultIds.join(', ')})
        `,
          {
            transaction: t,
            isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
          }
        );
      }
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
