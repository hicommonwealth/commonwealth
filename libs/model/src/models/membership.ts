import Sequelize from 'sequelize';
import { AddressAttributes } from './address';
import { GroupAttributes } from './group';
import { ModelInstance, ModelStatic } from './types';

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
  group_id: number;
  address_id: number;
  reject_reason?: MembershipRejectReason;
  last_checked: Date;

  // associations
  Group?: GroupAttributes;
  Address?: AddressAttributes;
};

export type MembershipInstance = ModelInstance<MembershipAttributes>;
export type MembershipModelStatic = ModelStatic<MembershipInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <MembershipModelStatic>sequelize.define<MembershipInstance>(
    'Membership',
    {
      group_id: { type: Sequelize.INTEGER, primaryKey: true },
      address_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      reject_reason: { type: Sequelize.JSONB, allowNull: true },
      last_checked: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'Memberships',
      underscored: true,
      timestamps: false,
      indexes: [{ fields: ['address_id'] }, { fields: ['group_id'] }],
    },
  );
