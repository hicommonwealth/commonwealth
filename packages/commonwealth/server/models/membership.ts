import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { AddressAttributes, AddressInstance } from './address';
import type {
  MemberClassAttributes,
  MemberClassInstance,
} from './member_class';
import type { ModelInstance, ModelStatic } from './types';

export type MembershipAttributes = {
  id?: number;
  member_class_id: number;
  address_id: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
  is_user_default?: boolean;

  // associations
  MemberClass?: MemberClassAttributes;
  Address?: AddressAttributes;
};

export type MembershipInstance = ModelInstance<MembershipAttributes> & {
  getMemberClass: Sequelize.BelongsToGetAssociationMixin<MemberClassInstance>;
  getAddress: Sequelize.BelongsToGetAssociationMixin<AddressInstance>;
};

export type MembershipModelStatic = ModelStatic<MembershipInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): MembershipModelStatic => {
  const Membership = <MembershipModelStatic>sequelize.define(
    'Membership',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      member_class_id: { type: dataTypes.INTEGER, allowNull: false },
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
      tableName: 'Memberships',
      underscored: true,
      indexes: [{ fields: ['member_class_id'] }, { fields: ['address_id'] }],
    }
  );

  Membership.associate = (models) => {
    models.Membership.belongsTo(models.MemberClass, {
      foreignKey: 'member_class_id',
      targetKey: 'id',
    });
    models.Membership.belongsTo(models.Address, {
      foreignKey: 'address_id',
      targetKey: 'id',
    });
  };

  return Membership;
};
