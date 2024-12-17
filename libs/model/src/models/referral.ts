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
      eth_chain_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      transaction_hash: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      namespace_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      referee_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      referrer_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      referrer_received_eth_amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      referral_created_timestamp: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      createdAt: false,
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'Referrals',
    },
  );
