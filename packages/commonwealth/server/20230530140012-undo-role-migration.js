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
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction: t },
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

      // query chain to a string containing allowed roles, example 1inch -> admin, moderator, member
      const communityRoles = await queryInterface.sequelize.query(
        `SELECT chain_id, array_to_string(array_agg(name), ', ') AS concatenated_names
         FROM "CommunityRoles"
         GROUP BY chain_id;`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction: t },
      );

      // create a javascript map representing the values
      const communityMap = new Map(communityRoles.map(c => [c.chain_id, stringToBitmask(c.concatenated_names)]));

      // can have types 0 = member, 2 = moderator, 4 = admin, others = mix
      await queryInterface.addColumn(
        'Chains',
        'allowed_roles',
        {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 7,
          validate: {
            min: 0,
            max: 7
          },
        },
        { transaction: t }
      );

      const communityKeys = [...communityMap.keys()];
      // insert this data into the chains table
      await queryInterface.sequelize.query(
        `
        UPDATE "Chains"
        SET role = CASE 
            ${communityKeys
          .map(
            (chain) =>
              `WHEN id = ${chain} THEN '${communityMap[chain]}'`
          )
          .join(' ')}
        END
        WHERE id IN (${communityKeys.join(', ')})
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

function stringToBitmask(permission) {
  let bitmask = 0;
  if (permission.includes('member')) {
    bitmask += 1;
  }

  if (permission.includes('moderator')) {
    bitmask += 2;
  }

  if (permission.includes('admin')) {
    bitmask += 4;
  }

  return bitmask;
}