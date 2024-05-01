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

export default (sequelize: Sequelize.Sequelize) =>
  <MembershipModelStatic>sequelize.define<MembershipInstance>(
    'Membership',
    {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      group_id: { type: Sequelize.INTEGER, allowNull: false },
      address_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reject_reason: { type: Sequelize.JSONB, allowNull: true },
      last_checked: { type: Sequelize.DATE, allowNull: false },
    },
    {
      underscored: true,
      timestamps: false,
      tableName: 'Memberships',
      indexes: [
        { fields: ['address_id'] },
        { fields: ['group_id'] },
        { fields: ['address_id', 'group_id'], unique: true },
      ],
    },
  );
