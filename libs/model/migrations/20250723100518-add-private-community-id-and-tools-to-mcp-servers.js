'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'MCPServers',
        'private_community_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
          references: {
            model: 'Communities',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'NO ACTION',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'MCPServers',
        'tools',
        {
          type: Sequelize.JSON,
          allowNull: false,
          defaultValue: [],
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'MCPServers',
        'auth_required',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'MCPServers',
        'auth_completed',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'MCPServers',
        'source_identifier',
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: '1',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'MCPServers',
        'auth_user_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.removeIndex('MCPServers', 'MCPServers_name_unique', {
        transaction,
      });

      await queryInterface.addIndex(
        'MCPServers',
        ['source', 'source_identifier'],
        {
          unique: true,
          name: 'MCPServers_source_source_identifier_unique',
          transaction,
        },
      );

      // Reset the sequence to prevent ID conflicts
      await queryInterface.sequelize.query(
        `SELECT setval('"MCPServers_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "MCPServers"), true);`,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('MCPServers', 'private_community_id', {
        transaction,
      });
      await queryInterface.removeColumn('MCPServers', 'tools', {
        transaction,
      });
      await queryInterface.removeColumn('MCPServers', 'auth_required', {
        transaction,
      });
      await queryInterface.removeColumn('MCPServers', 'auth_completed', {
        transaction,
      });
      await queryInterface.removeColumn('MCPServers', 'source_identifier', {
        transaction,
      });
      await queryInterface.removeColumn('MCPServers', 'auth_user_id', {
        transaction,
      });

      await queryInterface.addIndex('MCPServers', ['name'], {
        unique: true,
        name: 'MCPServers_name_unique',
        transaction,
      });

      await queryInterface.removeIndex(
        'MCPServers',
        'MCPServers_source_source_identifier_unique',
        {
          transaction,
        },
      );
    });
  },
};
