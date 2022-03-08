import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { ChainAttributes } from './chain';
import { OffchainThreadAttributes } from './offchain_thread';

export type OffchainViewCountAttributes = {
  object_id: number;
  view_count: number;
  id?: number;
  chain: string;
  Chain?: ChainAttributes;
  OffchainThread?: OffchainThreadAttributes;
};

export type OffchainViewCountInstance =
  ModelInstance<OffchainViewCountAttributes> & {};

export type OffchainViewCountModelStatic =
  ModelStatic<OffchainViewCountInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): OffchainViewCountModelStatic => {
  const OffchainViewCount = <OffchainViewCountModelStatic>sequelize.define(
    'OffchainViewCount',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      chain: { type: dataTypes.STRING, allowNull: false },
      object_id: { type: dataTypes.INTEGER, allowNull: false },
      view_count: { type: dataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: 'OffchainViewCounts',
      underscored: true,
      timestamps: false,
      indexes: [
        { fields: ['id'] },
        { fields: ['chain', 'object_id'] },
        { fields: ['view_count'] },
      ],
    }
  );

  OffchainViewCount.associate = (models) => {
    models.OffchainViewCount.belongsTo(models.Chain, {
      foreignKey: 'chain',
      targetKey: 'id',
    });
    models.OffchainViewCount.belongsTo(models.OffchainThread, {
      foreignKey: 'object_id',
      targetKey: 'id',
    });
  };

  return OffchainViewCount;
};
