import type * as Sequelize from 'sequelize';
import { AddressAttributes } from './address';
import { GroupAttributes } from './group';
import { DataTypes, ModelInstance, ModelStatic } from './types';

export type MembershipRejectReason =
  | {
      message: string;
      requirement: {
        data: any;
        rule: string;
      };
    }[]
  | null;

export type MembershipAttributes = {
  id?: number;
  group_id: number;
  address_id: number;
  reject_reason?: MembershipRejectReason;
  last_checked: Date;

  // associations
  group?: GroupAttributes;
  address?: AddressAttributes;
};

export type MembershipInstance = ModelInstance<MembershipAttributes>;
export type MembershipModelStatic = ModelStatic<MembershipInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: DataTypes,
): MembershipModelStatic => {
  const Membership = <MembershipModelStatic>sequelize.define(
    'Membership',
    {
      id: {
        type: dataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      group_id: { type: dataTypes.INTEGER, allowNull: false },
      address_id: {
        type: dataTypes.INTEGER,
        allowNull: false,
      },
      reject_reason: { type: dataTypes.JSONB, allowNull: true },
      last_checked: { type: dataTypes.DATE, allowNull: false },
    },
    {
      underscored: true,
      timestamps: false,
      createdAt: false,
      updatedAt: false,
      tableName: 'Memberships',
      indexes: [
        { fields: ['address_id'] },
        { fields: ['group_id'] },
        { fields: ['address_id', 'group_id'], unique: true },
      ],
    },
  );

  Membership.removeAttribute('created_at');
  Membership.removeAttribute('updated_at');

  Membership.associate = (models) => {
    models.Membership.belongsTo(models.Group, {
      foreignKey: 'group_id',
      targetKey: 'id',
      as: 'group',
    });
    models.Membership.belongsTo(models.Address, {
      foreignKey: 'address_id',
      targetKey: 'id',
      as: 'address',
    });
  };

  return Membership;
};
