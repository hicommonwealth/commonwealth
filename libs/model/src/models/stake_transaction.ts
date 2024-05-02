import { entities } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { z } from 'zod';
import { CommunityAttributes } from './community';
import type { ModelInstance, ModelStatic } from './types';

export type StakeTransactionAttributes = z.infer<
  typeof entities.StakeTransaction
> & {
  // associations
  Community?: CommunityAttributes;
};

export type StakeTransactionInstance =
  ModelInstance<StakeTransactionAttributes>;

export type StakeTransactionModelStatic = ModelStatic<StakeTransactionInstance>;

export default (sequelize: Sequelize.Sequelize): StakeTransactionModelStatic =>
  <StakeTransactionModelStatic>sequelize.define<StakeTransactionInstance>(
    'StakeTransaction',
    {
      transaction_hash: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      community_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      stake_id: { type: Sequelize.INTEGER, allowNull: false },
      address: { type: Sequelize.STRING, allowNull: false },
      stake_amount: { type: Sequelize.INTEGER, allowNull: false },
      stake_price: { type: Sequelize.BIGINT, allowNull: false },
      stake_direction: {
        type: Sequelize.ENUM('buy', 'sell'),
        allowNull: false,
      },
      timestamp: { type: Sequelize.INTEGER, allowNull: false },
    },
    {
      tableName: 'StakeTransactions',
      timestamps: false,
      indexes: [{ fields: ['address'] }, { fields: ['community_id'] }],
    },
  );
