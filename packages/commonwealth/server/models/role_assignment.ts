import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { AddressAttributes, AddressInstance } from './address';
import type { CommunityRoleAttributes, CommunityRoleInstance, } from './community_role';
import type { ModelInstance, ModelStatic } from './types';

export type RoleAssignmentAttributes = {
  id?: number;
  community_role_id: number;
  address_id: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
  is_user_default?: boolean;

  // associations
  CommunityRole?: CommunityRoleAttributes;
  Address?: AddressAttributes;
};

export type RoleAssignmentInstance = ModelInstance<RoleAssignmentAttributes> & {
  getCommunityRole: Sequelize.BelongsToGetAssociationMixin<CommunityRoleInstance>;
  getAddress: Sequelize.BelongsToGetAssociationMixin<AddressInstance>;
};

export type RoleAssignmentModelStatic = ModelStatic<RoleAssignmentInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): RoleAssignmentModelStatic => {
  const RoleAssignment = <RoleAssignmentModelStatic>sequelize.define(
    'RoleAssignment',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      community_role_id: { type: dataTypes.INTEGER, allowNull: false },
      address_id: { type: dataTypes.INTEGER, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
      is_user_default: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'RoleAssignments',
      underscored: true,
      indexes: [{ fields: ['community_role_id'] }, { fields: ['address_id'] }],
    }
  );

  RoleAssignment.associate = (models) => {
    models.RoleAssignment.belongsTo(models.CommunityRole, {
      foreignKey: 'community_role_id',
      targetKey: 'id',
    });
    models.RoleAssignment.belongsTo(models.Address, {
      foreignKey: 'address_id',
      targetKey: 'id',
    });
  };

  return RoleAssignment;
};
