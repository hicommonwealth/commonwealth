import Sequelize from 'sequelize';
import { MembershipAttributes } from './MembershipAttributes';
import { ModelInstance } from './types';

export type MembershipInstance = ModelInstance<MembershipAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<MembershipInstance> =>
  sequelize.define<MembershipInstance>(
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
