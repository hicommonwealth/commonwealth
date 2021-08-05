import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ModelStatic } from '../../shared/types';
import { ChainAttributes } from './chain';
import { OffchainCommunityAttributes } from './offchain_community';
import { OffchainThreadAttributes } from './offchain_thread';

export interface OffchainViewCountAttributes {
  id?: number;
  chain?: string;
  community?: string;
  object_id: number;
  view_count: number;
  Chain?: ChainAttributes;
  OffchainCommunity?: OffchainCommunityAttributes;
  OffchainThread?: OffchainThreadAttributes;
}

export interface OffchainViewCountInstance
extends Model<OffchainViewCountAttributes>, OffchainViewCountAttributes {

}

type OffchainViewCountModelStatic = ModelStatic<OffchainViewCountInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): OffchainViewCountModelStatic => {
  const OffchainViewCount = <OffchainViewCountModelStatic>sequelize.define('OffchainViewCount', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    chain: { type: dataTypes.STRING },
    community: { type: dataTypes.STRING },
    object_id: { type: dataTypes.INTEGER, allowNull: false },
    view_count: { type: dataTypes.INTEGER, allowNull: false },
  }, {
    tableName: 'OffchainViewCounts',
    underscored: true,
    timestamps: false,
    indexes: [
      { fields: ['id'] },
      { fields: ['chain', 'object_id'] },
      { fields: ['community', 'object_id'] },
      { fields: ['chain', 'community', 'object_id'] },
      { fields: ['view_count'] },
    ],
  });

  OffchainViewCount.associate = (models) => {
    models.OffchainViewCount.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.OffchainViewCount.belongsTo(models.OffchainCommunity, { foreignKey: 'community', targetKey: 'id' });
    models.OffchainViewCount.belongsTo(models.OffchainThread, { foreignKey: 'object_id', targetKey: 'id' });
  };

  return OffchainViewCount;
};
