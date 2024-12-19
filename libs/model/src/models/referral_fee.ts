import * as schemas from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type ReferralFeesAttributes = z.infer<typeof schemas.ReferralFees>;
export type ReferralFeesInstance = ModelInstance<ReferralFeesAttributes>;

export const ReferralFee = (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ReferralFeesInstance> =>
  sequelize.define<ReferralFeesInstance>(
    'ReferralFee',
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
      referrer_received_amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      transaction_timestamp: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: false,
      underscored: true,
      tableName: 'ReferralFees',
    },
  );
