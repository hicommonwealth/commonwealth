import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { AddressAttributes } from './address';
import type { ChainAttributes } from './chain';
import type { ModelInstance, ModelStatic } from './types';

export type Permission = 'admin' | 'moderator' | 'member';

export type RoleAttributes = {
  address_id: number;
  permission: Permission;
  id?: number;
  chain_id: string;
  is_user_default?: boolean;
  created_at?: Date;
  updated_at?: Date;

  // associations
  Address?: AddressAttributes;
  Chain?: ChainAttributes;
};

export type RoleInstance = ModelInstance<RoleAttributes>;

export type RoleModelStatic = ModelStatic<RoleInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): RoleModelStatic => {
  const Role = <RoleModelStatic>sequelize.define(
    'Role',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      address_id: { type: dataTypes.INTEGER, allowNull: false },
      chain_id: { type: dataTypes.STRING, allowNull: false },
      is_user_default: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      permission: {
        type: dataTypes.ENUM,
        values: ['admin', 'moderator', 'member'],
        defaultValue: 'member',
        allowNull: false,
      },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'Roles',
      underscored: true,
      indexes: [{ fields: ['address_id', 'chain_id'], unique: true }],
    }
  );

  Role.associate = (models) => {
    models.Role.belongsTo(models.Address, {
      foreignKey: 'address_id',
      targetKey: 'id',
    });
    models.Role.belongsTo(models.Chain, {
      foreignKey: 'chain_id',
      targetKey: 'id',
    });
  };

  return Role;
};
