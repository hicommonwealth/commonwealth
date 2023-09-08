import type * as Sequelize from 'sequelize';
import { DataTypes } from 'sequelize';
import { ModelInstance, ModelStatic } from './types';
import { GroupAttributes } from './group';

export type MembershipAttributes = {
  group_id: number;
  address_id: number;
  last_checked: Date;

  // associations
  Group?: GroupAttributes;
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
      last_checked: { type: dataTypes.DATE, allowNull: false },
    },
    {
      underscored: true,
      tableName: 'Memberships',
      indexes: [{ fields: ['group_id'] }],
    }
  );

  Membership.associate = (models) => {
    models.Membership.belongsTo(models.Group, {
      foreignKey: 'group_id',
      targetKey: 'id',
    });
  };

  return Membership;
};
