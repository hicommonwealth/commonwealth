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

      const roles = await queryInterface.sequelize.query(
        `SELECT address_id, permission FROM "Roles"`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      const ids = roles.map((r) => r.address_id);
      const permissions = roles.map((r) => r.permission);

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
