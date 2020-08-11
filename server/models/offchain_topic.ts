import * as Sequelize from 'sequelize';

import { ChainAttributes } from './chain';
import { OffchainCommunityAttributes } from './offchain_community';
import { OffchainThreadAttributes } from './offchain_thread';

export interface OffchainTopicAttributes {
  id?: number;
  name: string;
  description?: string;
  community_id: string;
  chain_id: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;

  // associations
  community?: OffchainCommunityAttributes;
  chain?: ChainAttributes;
  threads?: OffchainThreadAttributes[] | OffchainTopicAttributes['id'][];
}

export interface OffchainTopicInstance extends Sequelize.Instance<OffchainTopicAttributes>, OffchainTopicAttributes {
  // no mixins used
  // TODO: do we need to implement the "as" stuff here?
}

export interface OffchainTopicModel extends Sequelize.Model<OffchainTopicInstance, OffchainTopicAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): OffchainTopicModel => {
  const OffchainTopic = sequelize.define<OffchainTopicInstance, OffchainTopicAttributes>('OffchainTopic', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: dataTypes.STRING, allowNull: false },
    description: { type: dataTypes.TEXT, allowNull: false, defaultValue: '' },
    community_id: { type: dataTypes.STRING, allowNull: true },
    chain_id: { type: dataTypes.STRING, allowNull: true },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
    deleted_at: { type: dataTypes.DATE, allowNull: true },
  }, {
    underscored: true,
    paranoid: true,
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
