import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type WalletAttributes = {
  id?: string;
  base_id: string;
}

export type WalletInstance = ModelInstance<WalletAttributes> & {
  // TODO: add mixins as needed
  getWallets: Sequelize.HasManyGetAssociationsMixin<WalletInstance>;
}

export type WalletModelStatic = ModelStatic<WalletInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): WalletModelStatic => {
  const Wallet = <WalletModelStatic>sequelize.define(
    'Wallet',
    {
      id: { type: dataTypes.STRING, primaryKey: true },
      base_id: { type: dataTypes.STRING, allowNull: false }
    },
    {
      tableName: 'Wallets',
      timestamps: false,
      underscored: true,
    },
  );

  Wallet.associate = (models) => {
    models.Wallet.belongsTo(models.ChainBase, { foreignKey: 'base_id', targetKey: 'id' });
    models.Wallet.hasMany(models.Address, { foreignKey: 'wallet_id' });
    models.Wallet.hasMany(models.Chain, { foreignKey: 'wallet_override' });
  };

  return Wallet;
};
