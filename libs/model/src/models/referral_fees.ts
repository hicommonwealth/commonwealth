import * as schemas from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type ReferralFeesAttributes = z.infer<typeof schemas.ReferralFees>;
export type ReferralFeesInstance = ModelInstance<ReferralFeesAttributes>;

export const ReferralFees = (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ReferralFeesInstance> =>
  sequelize.define<ReferralFeesInstance>(
    'ReferralFees',
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
      distributed_token_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      referrer_recipient_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      referrer_received_eth_amount: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      underscored: true,
      tableName: 'ReferralFees',
    },
  );
