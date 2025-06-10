import Sequelize from 'sequelize';
import type { CommunityAttributes, CommunityInstance } from './community';
import type { MCPServerAttributes, MCPServerInstance } from './mcp_server';
import type { ModelInstance } from './types';

export type MCPServerCommunityAttributes = {
  mcp_server_id: number;
  community_id: string;
  created_at?: Date;
  updated_at?: Date;

  // associations
  MCPServer?: MCPServerAttributes;
  Community?: CommunityAttributes;
};

export type MCPServerCommunityInstance =
  ModelInstance<MCPServerCommunityAttributes> & {
    getMCPServer: Sequelize.BelongsToGetAssociationMixin<MCPServerInstance>;
    setMCPServer: Sequelize.BelongsToSetAssociationMixin<
      MCPServerInstance,
      MCPServerInstance['id']
    >;
    getCommunity: Sequelize.BelongsToGetAssociationMixin<CommunityInstance>;
    setCommunity: Sequelize.BelongsToSetAssociationMixin<
      CommunityInstance,
      CommunityInstance['id']
    >;
  };

export type MCPServerCommunityModelStatic =
  Sequelize.ModelStatic<MCPServerCommunityInstance>;

export default (
  sequelize: Sequelize.Sequelize,
): MCPServerCommunityModelStatic =>
  <MCPServerCommunityModelStatic>sequelize.define<MCPServerCommunityInstance>(
    'MCPServerCommunity',
    {
      mcp_server_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      community_id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'MCPServerCommunities',
      underscored: true,
      indexes: [{ fields: ['mcp_server_id'] }, { fields: ['community_id'] }],
    },
  );
