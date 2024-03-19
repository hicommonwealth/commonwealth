import { schemas } from '@hicommonwealth/core';
import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { DataTypes } from 'sequelize';
import { z } from 'zod';
import { CommunityAttributes } from './community';
import type { ModelInstance, ModelStatic } from './types';

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
  dataTypes: typeof DataTypes,
): StakeTransactionModelStatic => {
  const StakeTransaction = <StakeTransactionModelStatic>sequelize.define(
    'StakeTransactions',
    {
      id: {
        type: dataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      community_id: {
        type: dataTypes.STRING,
        allowNull: false,
      },
      stake_id: { type: dataTypes.INTEGER, allowNull: false },
      address_id: { type: dataTypes.INTEGER, allowNull: false },
      stake_price: { type: dataTypes.STRING, allowNull: false },
      stake_direction: {
        type: dataTypes.ENUM('buy', 'sell'),
        allowNull: false,
      },
      created_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      underscored: true,
      tableName: 'StakeTransactions',
      indexes: [{ fields: ['address'] }, { fields: ['community_id'] }],
    },
  );

  StakeTransaction.associate = (models) => {
    models.StakeTransaction.belongsTo(models.CommunityStake, {
      foreignKey: 'community_id',
      targetKey: 'community_id',
    });
    models.StakeTransaction.belongsTo(models.CommunityStake, {
      foreignKey: 'stake_id',
      targetKey: 'stake_id',
    });
    models.StakeTransaction.belongsTo(models.Address, {
      foreignKey: 'address',
      targetKey: 'id',
    });
  };

  return StakeTransaction;
};
