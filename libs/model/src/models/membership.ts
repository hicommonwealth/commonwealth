import { Membership } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { ModelInstance } from './types';

export type MembershipAttributes = z.infer<typeof Membership>;
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
