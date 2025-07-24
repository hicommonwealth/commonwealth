import { MCPServer } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type MCPServerAttributes = z.infer<typeof MCPServer>;

export type MCPServerInstance = ModelInstance<MCPServerAttributes>;

export type MCPServerModelStatic = Sequelize.ModelStatic<MCPServerInstance>;

export default (sequelize: Sequelize.Sequelize): MCPServerModelStatic =>
  <MCPServerModelStatic>sequelize.define<MCPServerInstance>(
    'MCPServer',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.STRING, allowNull: false },
      handle: { type: Sequelize.STRING, allowNull: false },
      server_url: { type: Sequelize.STRING, allowNull: false },
      source: { type: Sequelize.STRING, allowNull: false },
      source_identifier: { type: Sequelize.STRING, allowNull: false },
      private_community_id: { type: Sequelize.STRING, allowNull: true },
      tools: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      auth_required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      auth_completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      auth_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'MCPServers',
      underscored: true,
      defaultScope: {
        attributes: {
          exclude: ['source_identifier', 'server_url'],
        },
      },
      scopes: {
        withPrivateData: {},
      },
      indexes: [
        {
          fields: ['source', 'source_identifier'],
          unique: true,
          name: 'MCPServers_source_source_identifier_unique',
        },
      ],
    },
  );
