'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'GroupPermissions',
        'allowed_actions',
        'gated_actions',
        { transaction },
      );

      // converted from allowed actions to gated actions
      await queryInterface.sequelize.query(
        `
          UPDATE "GroupPermissions"
          SET gated_actions = ARRAY(
            SELECT unnest(ARRAY ['CREATE_THREAD', 'CREATE_COMMENT', 'CREATE_THREAD_REACTION', 'CREATE_COMMENT_REACTION', 'UPDATE_POLL']::"enum_GroupPermissions_allowed_actions"[])
            EXCEPT
            SELECT unnest(gated_actions)
                              )
        `,
        { transaction },
      );

      // Remove 'old style' group permission which gated all actions the same
      await queryInterface.sequelize.query(
        `
          UPDATE "GroupPermissions"
          SET gated_actions = ARRAY ['CREATE_THREAD', 'CREATE_COMMENT', 'CREATE_THREAD_REACTION', 'CREATE_COMMENT_REACTION', 'UPDATE_POLL']::"enum_GroupPermissions_allowed_actions"[]
          WHERE gated_actions = '{}'
        `,
        { transaction },
      );

      await queryInterface.renameTable(
        'GroupPermissions',
        'GroupGatedActions',
        {
          transaction,
        },
      );

      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_GroupPermissions_allowed_actions" RENAME TO "enum_GroupGatedActions_gated_actions"`,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {},
};
