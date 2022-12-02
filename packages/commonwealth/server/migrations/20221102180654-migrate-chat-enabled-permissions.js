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
      // query to get all the chains that have chat disabled
      // eslint-disable-next-line no-bitwise
      const view_chat_channels_permission = BigInt(1) << BigInt(11);

      // set the view_chat_channels bit on default_deny_permissions to 1 for all the chains that have chat disabled
      await queryInterface.sequelize.query(
        `UPDATE "Chains" SET "default_deny_permissions" = "default_deny_permissions" | ${view_chat_channels_permission} 
      WHERE "chat_enabled" = false;`,
        { transaction: t }
      );

      // remove the chat_enabled column
      await queryInterface.removeColumn('Chains', 'chat_enabled', {
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return queryInterface.sequelize.transaction(async (t) => {
      // add the chat_enabled column
      await queryInterface.addColumn('Chains', 'chat_enabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });

      // query to get all the chains that have chat disabled
      // eslint-disable-next-line no-bitwise
      const view_chat_channels_permission = BigInt(1) << BigInt(11);

      // set chat enabled to false for all the chains that have view_chat_channels bit set to 1
      await queryInterface.sequelize.query(
        `UPDATE "Chains" SET "chat_enabled" = false 
        WHERE "default_deny_permissions" & ${view_chat_channels_permission} = ${view_chat_channels_permission};`,
        { transaction: t }
      );

      // remove the view_chat_channels bit from default_deny_permissions
      await queryInterface.sequelize.query(
        `UPDATE "Chains" 
        SET "default_deny_permissions" = "default_deny_permissions" & ~${view_chat_channels_permission};`,
        { transaction: t }
      );
    });
  },
};
