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
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      eth_chain_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      transaction_hash: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      namespace_address: {
        type: Sequelize.STRING,
        allowNull: true,
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
      created_on_chain_timestamp: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      created_off_chain_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      createdAt: 'created_off_chain_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'Referrals',
      indexes: [
        { fields: ['referee_address'] },
        { fields: ['referrer_address'] },
        {
          fields: ['eth_chain_id', 'transaction_hash'],
          unique: true,
        },
      ],
    },
  );
