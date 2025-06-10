import Sequelize from 'sequelize';
import type { ModelInstance } from './types';

export type MCPServerAttributes = {
  id?: number;
  name: string;
  server_url: string;
  created_at?: Date;
  updated_at?: Date;
};

export type MCPServerInstance = ModelInstance<MCPServerAttributes>;

export type MCPServerModelStatic = Sequelize.ModelStatic<MCPServerInstance>;

export default (sequelize: Sequelize.Sequelize): MCPServerModelStatic =>
  <MCPServerModelStatic>sequelize.define<MCPServerInstance>(
    'MCPServer',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      server_url: { type: Sequelize.STRING, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'mcp_servers',
      underscored: true,
      indexes: [{ fields: ['name'], unique: true }],
    },
  );
