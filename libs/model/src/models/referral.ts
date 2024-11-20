import * as schemas from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type ReferralAttributes = z.infer<typeof schemas.Referral>;
export type ReferralInstance = ModelInstance<ReferralAttributes>;

export const Referral = (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ReferralInstance> =>
  sequelize.define<ReferralInstance>(
    'Referral',
    {
      referrer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      referee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      event_name: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      event_payload: { type: Sequelize.JSONB, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: true, primaryKey: true },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      underscored: true,
      tableName: 'Referrals',
    },
  );
