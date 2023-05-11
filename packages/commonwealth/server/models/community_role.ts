import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { CommunityAttributes } from './communities';
import type { Permission } from './role';
import type {
  RoleAssignmentAttributes,
  RoleAssignmentInstance,
} from './role_assignment';
import type { ModelInstance, ModelStatic } from './types';

export type CommunityRoleAttributes = {
  name: Permission;
  id?: number;
  chain_id: string;
  allow: bigint;
  deny: bigint;
  created_at?: Date;
  updated_at?: Date;

  // associations
  RoleAssignments?: RoleAssignmentAttributes[];
  Chain?: CommunityAttributes;
};

export type CommunityRoleInstance = ModelInstance<CommunityRoleAttributes> & {
  getRoleAssignments: Sequelize.HasManyGetAssociationsMixin<RoleAssignmentInstance>;
};

export type CommunityRoleModelStatic = ModelStatic<CommunityRoleInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): CommunityRoleModelStatic => {
  const CommunityRole = <CommunityRoleModelStatic>sequelize.define(
    'CommunityRole',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      chain_id: { type: dataTypes.STRING, allowNull: false, field: 'community_id' },
      name: {
        type: dataTypes.ENUM,
        values: ['admin', 'moderator', 'member'],
        defaultValue: 'member',
        allowNull: false,
      },
      allow: {
        type: dataTypes.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      deny: {
        type: dataTypes.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'CommunityRoles',
      underscored: true,
      indexes: [{ fields: ['community_id'] }],
    }
  );

  CommunityRole.associate = (models) => {
    models.CommunityRole.hasMany(models.RoleAssignment, {
      foreignKey: 'community_role_id',
    });
    models.CommunityRole.belongsTo(models.Community, {
      foreignKey: 'community_id',
      targetKey: 'id',
    });
  };

  return CommunityRole;
};
