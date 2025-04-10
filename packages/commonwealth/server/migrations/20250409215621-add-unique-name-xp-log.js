'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'XpLogs',
        'name',
        { type: Sequelize.STRING, allowNull: true },
        { transaction },
      );
      await queryInterface.removeConstraint('XpLogs', 'XpLogs_pkey', {
        transaction,
      });

      // Add a new SERIAL id column as primary key
      await queryInterface.addColumn(
        'XpLogs',
        'id',
        {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          allowNull: false,
        },
        { transaction },
      );
      await queryInterface.addConstraint('XpLogs', {
        type: 'primary key',
        fields: ['id'],
        name: 'XpLogs_pkey',
        transaction,
      });

      await queryInterface.sequelize.query(
        `
        ALTER TABLE "XpLogs"
          ADD CONSTRAINT xp_logs_user_id_action_meta_id_event_created_at_name
            UNIQUE NULLS NOT DISTINCT (user_id, action_meta_id, event_created_at, name);
      `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Remove the unique index
      await queryInterface.removeConstraint(
        'XpLogs',
        'xp_logs_user_id_action_meta_id_event_created_at_name',
        { transaction },
      );

      // Remove the primary key constraint
      await queryInterface.removeConstraint('XpLogs', 'XpLogs_pkey', {
        transaction,
      });

      // Remove the id column
      await queryInterface.removeColumn('XpLogs', 'id', { transaction });

      // Restore the original primary key
      await queryInterface.addConstraint('XpLogs', {
        type: 'primary key',
        fields: ['user_id', 'action_meta_id', 'event_created_at'],
        name: 'XpLogs_pkey',
        transaction,
      });

      // Remove the name column
      await queryInterface.removeColumn('XpLogs', 'name', { transaction });
    });
  },
};
