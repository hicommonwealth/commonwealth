import { schemas } from '@hicommonwealth/core';
import type * as Sequelize from 'sequelize';
import { DataTypes } from 'sequelize';
import { z } from 'zod';
import { ModelInstance, ModelStatic } from './types';
import { UserAttributes } from './user';

export type WalletAttributes = z.infer<typeof schemas.entities.Wallets> & {
  //associations
  User: UserAttributes;
};

export type WalletInstance = ModelInstance<WalletAttributes>;

export type WalletModelStatic = ModelStatic<WalletInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): WalletModelStatic => {
  const Wallets = <WalletModelStatic>sequelize.define(
    'Wallets',
    {
      id: { type: dataTypes.INTEGER, allowNull: false, primaryKey: true },
      user_id: { type: dataTypes.INTEGER, allowNull: false },
      user_address: { type: dataTypes.STRING, allowNull: false },
      relay_address: { type: dataTypes.STRING, allowNull: false },
      wallet_address: { type: dataTypes.STRING, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      underscored: true,
      tableName: 'Wallets',
    },
  );
  Wallets.associate = (models) => {
    models.Wallets.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'id',
    });
  };

  return Wallets;
};
