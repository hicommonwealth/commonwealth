import * as Sequelize from 'sequelize';
import { BuildOptions, DataTypes, Model } from 'sequelize';

import { ChainAttributes } from './chain';
import { OffchainCommunityAttributes } from './offchain_community';
import { OffchainThreadAttributes } from './offchain_thread';

export interface OffchainTopicAttributes {
  id?: number;
  name: string;
  description?: string;
  telegram?: string;
  chain_id: string;
  community_id: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;

  // associations
  community?: OffchainCommunityAttributes;
  chain?: ChainAttributes;
  threads?: OffchainThreadAttributes[] | OffchainTopicAttributes['id'][];
}

export interface OffchainTopicInstance extends Model<OffchainTopicAttributes>, OffchainTopicAttributes {
  // no mixins used
  // TODO: do we need to implement the "as" stuff here?
}

type OffchainTopicModelStatic = typeof Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: BuildOptions): OffchainTopicInstance }

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): OffchainTopicModelStatic => {
  const OffchainTopic = <OffchainTopicModelStatic>sequelize.define('OffchainTopic', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: dataTypes.STRING, allowNull: false },
    description: { type: dataTypes.TEXT, allowNull: false, defaultValue: '' },
    telegram: { type: dataTypes.STRING, allowNull: true },
    chain_id: { type: dataTypes.STRING, allowNull: true },
    community_id: { type: dataTypes.STRING, allowNull: true },
    created_at: { type: dataTypes.DATE, allowNull: false, defaultValue: dataTypes.NOW },
    updated_at: { type: dataTypes.DATE, allowNull: false, defaultValue: dataTypes.NOW },
    deleted_at: { type: dataTypes.DATE, allowNull: true },
  }, {
    tableName: 'OffchainTopics',
    underscored: true,
    paranoid: true,
    defaultScope: {
      attributes: {
        exclude: [ 'created_at', 'updated_at', 'deleted_at' ],
      }
    },
  });

  OffchainTopic.associate = (models) => {
    models.OffchainTopic.belongsTo(models.OffchainCommunity, {
      as: 'community',
      foreignKey: 'community_id',
      targetKey: 'id',
    });
    models.OffchainTopic.belongsTo(models.Chain, {
      as: 'chain',
      foreignKey: 'chain_id',
      targetKey: 'id',
    });
    models.OffchainTopic.hasMany(models.OffchainThread, {
      as: 'threads',
      foreignKey: 'topic_id',
    });
  };

  return OffchainTopic;
};
