import { Wallets } from '@hicommonwealth/schemas';
import type * as Sequelize from 'sequelize';
import { z } from 'zod';
import { ModelInstance } from './types';
import { UserAttributes } from './user';

export type WalletAttributes = z.infer<typeof Wallets> & {
  //associations
  User?: UserAttributes;
};

export type WalletInstance = ModelInstance<WalletAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<WalletInstance> =>
  sequelize.define<WalletInstance>(
    'Wallets',
    {
      id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      user_address: { type: Sequelize.STRING, allowNull: false },
      relay_address: { type: Sequelize.STRING, allowNull: false },
      wallet_address: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      underscored: true,
      tableName: 'Wallets',
    },
  );
