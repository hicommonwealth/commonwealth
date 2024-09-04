import { Wallets } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
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
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      user_address: { type: Sequelize.STRING, allowNull: false },
      relay_address: { type: Sequelize.STRING, allowNull: false },
      wallet_address: { type: Sequelize.STRING, allowNull: false },
    },
    {
      timestamps: true,
      underscored: true,
      tableName: 'Wallets',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );
