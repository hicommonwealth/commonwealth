import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { Model, DataTypes } from 'sequelize';
import { WalletInstance, WalletAttributes } from './wallet';
import { ModelStatic, ModelInstance } from './types';

export type ChainBaseAttributes = {
  id?: string;

  // associations
  Wallets?: WalletAttributes[];
}

export type ChainBaseInstance = ModelInstance<ChainBaseAttributes> & {
  // TODO: add mixins as needed
  getWallets: Sequelize.HasManyGetAssociationsMixin<WalletInstance>;
}

export type ChainBaseModelStatic = ModelStatic<ChainBaseInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ChainBaseModelStatic => {
  const ChainBase = <ChainBaseModelStatic>sequelize.define(
    'ChainBase',
    {
      id: { type: dataTypes.STRING, primaryKey: true },
    },
    {
      tableName: 'ChainBases',
      timestamps: false,
      underscored: true,
    },
  );

  ChainBase.associate = (models) => {
    models.ChainBase.hasMany(models.Wallet, { foreignKey: 'base_id' });
    models.ChainBase.hasMany(models.Chain, { foreignKey: 'base_id' });
  };

  return ChainBase;
};
