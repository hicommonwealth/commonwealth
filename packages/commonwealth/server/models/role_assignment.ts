import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { AddressAttributes } from './address';
import { CommunityRoleAttributes } from './community_role';
import { ModelStatic, ModelInstance } from './types';

export type RoleAssignmentAttributes = {
  id?: number;
  community_role_id: number;
  address_id: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;

  // associations
  CommunityRole?: CommunityRoleAttributes;
  Address?: AddressAttributes;
};

export type RoleAssignmentInstance = ModelInstance<RoleAssignmentAttributes>;

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
      updated_at: { type: dataTypes.DATE, allowNull: false },
      deleted_at: { type: dataTypes.DATE, allowNull: true },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      tableName: 'RoleAssignment',
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
