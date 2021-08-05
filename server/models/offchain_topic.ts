import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ModelStatic } from '../../shared/types';
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
  featured_in_sidebar: boolean;
  featured_in_new_post: boolean;

  // associations
  community?: OffchainCommunityAttributes;
  chain?: ChainAttributes;
  threads?: OffchainThreadAttributes[] | OffchainTopicAttributes['id'][];
}

export interface OffchainTopicInstance extends Model<OffchainTopicAttributes>, OffchainTopicAttributes {
  // no mixins used
  // TODO: do we need to implement the "as" stuff here?
}

type OffchainTopicModelStatic = ModelStatic<OffchainTopicInstance>

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
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
    deleted_at: { type: dataTypes.DATE, allowNull: true },
    featured_in_sidebar: { type: dataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    featured_in_new_post: { type: dataTypes.BOOLEAN, allowNull: true, defaultValue: false },
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
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
