import { schemas } from '@hicommonwealth/core';
import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { z } from 'zod';
import { CommunityAttributes } from './community';
import type { DataTypes, ModelInstance, ModelStatic } from './types';

export type StakeTransactionAttributes = z.infer<
  typeof schemas.entities.StakeTransaction
> & {
  // associations
  Chain?: CommunityAttributes;
};

export type StakeTransactionInstance =
  ModelInstance<StakeTransactionAttributes>;

export type StakeTransactionModelStatic = ModelStatic<StakeTransactionInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: DataTypes,
): StakeTransactionModelStatic =>
  <StakeTransactionModelStatic>sequelize.define<StakeTransactionInstance>(
    'StakeTransaction',
    {
      transaction_hash: {
        type: dataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      community_id: {
        type: dataTypes.STRING,
        allowNull: false,
      },
      stake_id: { type: dataTypes.INTEGER, allowNull: false },
      address: { type: dataTypes.STRING, allowNull: false },
      stake_amount: { type: dataTypes.INTEGER, allowNull: false },
      stake_price: { type: dataTypes.BIGINT, allowNull: false },
      stake_direction: {
        type: dataTypes.ENUM('buy', 'sell'),
        allowNull: false,
      },
      timestamp: { type: dataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: 'StakeTransactions',
      timestamps: false,
      indexes: [{ fields: ['address'] }, { fields: ['community_id'] }],
    },
  );
