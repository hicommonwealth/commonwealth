import * as Sequelize from 'sequelize';

import { AddressAttributes } from './address';
import { ChainAttributes } from './chain';
import { OffchainCommunityAttributes } from './offchain_community';
import { OffchainAttachmentAttributes } from './offchain_attachment';
import { ChainEntityAttributes } from './chain_entity';

export interface OffchainThreadAttributes {
  id?: number;
  address_id: number;
  title: string;
  body?: string;
  plaintext?: string;
  kind: string;
  stage: string;
  url?: string;
  topic_id?: number;
  pinned?: boolean;
  chain?: string;
  community?: string;

  read_only?: boolean;
  version_history?: string[];

  offchain_voting_options: string;
  offchain_voting_ends_at?: Date;
  offchain_voting_votes?: number;

  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;

  // associations
  Chain?: ChainAttributes;
  OffchainCommunity?: OffchainCommunityAttributes;
  Address?: AddressAttributes;
  OffchainAttachments?: OffchainAttachmentAttributes[] | OffchainAttachmentAttributes['id'][];
  ChainEntity?: ChainEntityAttributes;
}

export interface OffchainThreadInstance extends Sequelize.Instance<OffchainThreadAttributes>, OffchainThreadAttributes {
  // no mixins used
}

export interface OffchainThreadModel extends Sequelize.Model<OffchainThreadInstance, OffchainThreadAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): OffchainThreadModel => {
  const OffchainThread = sequelize.define<OffchainThreadInstance, OffchainThreadAttributes>('OffchainThread', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    address_id: { type: dataTypes.INTEGER, allowNull: false },
    title: { type: dataTypes.TEXT, allowNull: false },
    body: { type: dataTypes.TEXT, allowNull: true },
    plaintext: { type: dataTypes.TEXT, allowNull: true },
    kind: { type: dataTypes.TEXT, allowNull: false },
    stage: { type: dataTypes.TEXT, allowNull: false, defaultValue: 'discussion' },
    url: { type: dataTypes.TEXT, allowNull: true },
    topic_id: { type: dataTypes.INTEGER, allowNull: true },
    pinned: { type: dataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    chain: { type: dataTypes.STRING, allowNull: true },
    community: { type: dataTypes.STRING, allowNull: true },
    read_only: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    version_history: { type: dataTypes.ARRAY(dataTypes.TEXT), defaultValue: [], allowNull: false },

    offchain_voting_options: { type: dataTypes.STRING },
    offchain_voting_ends_at: { type: dataTypes.DATE, allowNull: true },
    offchain_voting_votes: { type: dataTypes.INTEGER, allowNull: true },

    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
    deleted_at: { type: dataTypes.DATE, allowNull: true },
  }, {
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['address_id'] },
      { fields: ['chain'] },
      { fields: ['community'] },
      { fields: ['chain', 'created_at'] },
      { fields: ['community', 'created_at'] },
      { fields: ['chain', 'updated_at'] },
      { fields: ['community', 'updated_at'] },
      { fields: ['chain', 'pinned'] },
      { fields: ['community', 'pinned'] },
      { fields: ['chain', 'offchain_voting_ends_at'] },
      { fields: ['community', 'offchain_voting_ends_at'] },
      { fields: ['chain', 'offchain_voting_votes'] },
      { fields: ['community', 'offchain_voting_votes'] },
    ],
  });

  OffchainThread.associate = (models) => {
    models.OffchainThread.belongsTo(models.Chain, {
      foreignKey: 'chain',
      targetKey: 'id',
    });
    models.OffchainThread.belongsTo(models.OffchainCommunity, {
      foreignKey: 'community',
      targetKey: 'id'
    });
    models.OffchainThread.belongsTo(models.Address, {
      as: 'Address',
      foreignKey: 'address_id',
      targetKey: 'id'
    });
    models.OffchainThread.hasMany(models.OffchainAttachment, {
      foreignKey: 'attachment_id',
      constraints: false,
      scope: { attachable: 'thread' },
    });
    models.OffchainThread.belongsTo(models.OffchainTopic, {
      as: 'topic',
      foreignKey: 'topic_id',
    });
    models.OffchainThread.belongsToMany(models.Role, {
      through: 'read_only_roles_threads',
      as: 'read_only_roles',
      foreignKey: 'thread_id',
      otherKey: 'id',
    });
    models.OffchainThread.belongsToMany(models.Address, {
      through: models.Collaboration,
      as: 'collaborators'
    });
    models.OffchainThread.hasMany(models.OffchainReaction, {
      foreignKey: 'thread_id',
      as: 'reactions'
    });
    models.OffchainThread.hasMany(models.Collaboration);
    models.OffchainThread.hasMany(models.ChainEntity, {
      foreignKey: 'thread_id',
      constraints: false,
    });
    models.OffchainThread.hasMany(models.OffchainVote, {
      foreignKey: 'thread_id',
      constraints: false,
    });
  };

  return OffchainThread;
};
