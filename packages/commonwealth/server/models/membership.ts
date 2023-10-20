import type * as Sequelize from 'sequelize';
import { DataTypes } from 'sequelize';
import { ModelInstance, ModelStatic } from './types';
import { GroupAttributes } from './group';
import { AddressAttributes } from './address';

export type MembershipAttributes = {
  group_id: number;
  address_id: number;
  reject_reason?: string;
  last_checked: Date;

  // associations
  group?: GroupAttributes;
  address?: AddressAttributes;
};

export type MembershipInstance = ModelInstance<MembershipAttributes>;
export type MembershipModelStatic = ModelStatic<MembershipInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): MembershipModelStatic => {
  const Membership = <MembershipModelStatic>sequelize.define(
    'Membership',
    {
      group_id: { type: dataTypes.INTEGER, allowNull: false },
      address_id: { type: dataTypes.INTEGER, allowNull: false },
      reject_reason: { type: dataTypes.STRING, allowNull: true },
      last_checked: { type: dataTypes.DATE, allowNull: false },
    },
    {
      underscored: true,
      timestamps: false,
      tableName: 'Memberships',
      indexes: [{ fields: ['group_id'] }],
    }
  );

  Membership.removeAttribute('id');

  Membership.associate = (models) => {
    models.Membership.belongsTo(models.Group, {
      foreignKey: 'group_id',
      targetKey: 'id',
      as: 'group'
    });
    models.Membership.belongsTo(models.Address, {
      foreignKey: 'address_id',
      targetKey: 'id',
      as: 'address'
    });
  };

  return Membership;
};
