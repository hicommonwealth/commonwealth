import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { AddressAttributes } from './address';
import { ChainAttributes } from './chain';
import { OffchainAttachmentAttributes } from './offchain_attachment';
import { ChainEntityAttributes } from './chain_entity';
import { LinkedThreadAttributes } from './linked_thread';

export type OffchainThreadAttributes = {
  address_id: number;
  title: string;
  kind: string;
  stage: string;
  id?: number;
  body?: string;
  plaintext?: string;
  url?: string;
  topic_id?: number;
  pinned?: boolean;
  chain: string;

  read_only?: boolean;
  version_history?: string[];
  snapshot_proposal?: string;

  offchain_voting_enabled?: boolean;
  offchain_voting_options?: string;
  offchain_voting_ends_at?: Date;
  offchain_voting_votes?: number;

  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
  last_commented_on?: Date;

  // associations
  Chain?: ChainAttributes;
  Address?: AddressAttributes;
  OffchainAttachments?:
    | OffchainAttachmentAttributes[]
    | OffchainAttachmentAttributes['id'][];
  ChainEntity?: ChainEntityAttributes;
  collaborators?: AddressAttributes[];
  linked_threads?: LinkedThreadAttributes[];
}

export type OffchainThreadInstance = ModelInstance<OffchainThreadAttributes> & {
  // no mixins used
}

export type OffchainThreadModelStatic = ModelStatic<OffchainThreadInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): OffchainThreadModelStatic => {
  const OffchainThread = <OffchainThreadModelStatic>sequelize.define(
    'OffchainThread',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      address_id: { type: dataTypes.INTEGER, allowNull: false },
      title: { type: dataTypes.TEXT, allowNull: false },
      body: { type: dataTypes.TEXT, allowNull: true },
      plaintext: { type: dataTypes.TEXT, allowNull: true },
      kind: { type: dataTypes.TEXT, allowNull: false },
      stage: {
        type: dataTypes.TEXT,
        allowNull: false,
        defaultValue: 'discussion',
      },
      url: { type: dataTypes.TEXT, allowNull: true },
      topic_id: { type: dataTypes.INTEGER, allowNull: true },
      pinned: {
        type: dataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      chain: { type: dataTypes.STRING, allowNull: false },
      read_only: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      version_history: {
        type: dataTypes.ARRAY(dataTypes.TEXT),
        defaultValue: [],
        allowNull: false,
      },
      snapshot_proposal: { type: dataTypes.STRING(48), allowNull: true },

      offchain_voting_enabled: { type: dataTypes.BOOLEAN, allowNull: true },
      offchain_voting_options: { type: dataTypes.STRING, allowNull: true },
      offchain_voting_ends_at: { type: dataTypes.DATE, allowNull: true },
      offchain_voting_votes: { type: dataTypes.INTEGER, allowNull: true },

      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
      deleted_at: { type: dataTypes.DATE, allowNull: true },
      last_commented_on: { type: dataTypes.DATE, allowNull: true }
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      underscored: true,
      tableName: 'OffchainThreads',
      paranoid: true,
      indexes: [
        { fields: ['address_id'] },
        { fields: ['chain'] },
        { fields: ['chain', 'created_at'] },
        { fields: ['chain', 'updated_at'] },
        { fields: ['chain', 'pinned'] },
        { fields: ['chain', 'offchain_voting_enabled'] },
        { fields: ['chain', 'offchain_voting_ends_at'] },
        { fields: ['chain', 'offchain_voting_votes'] },
      ],
    }
  );

  OffchainThread.associate = (models) => {
    models.OffchainThread.belongsTo(models.Chain, {
      foreignKey: 'chain',
      targetKey: 'id',
    });
    models.OffchainThread.belongsTo(models.Address, {
      as: 'Address',
      foreignKey: 'address_id',
      targetKey: 'id',
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
      as: 'collaborators',
    });
    models.OffchainThread.hasMany(models.OffchainReaction, {
      foreignKey: 'thread_id',
      as: 'reactions',
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
    models.OffchainThread.hasMany(models.LinkedThread, {
      foreignKey: 'linked_thread',
      as: 'linking_threads',
    });
    models.OffchainThread.hasMany(models.LinkedThread, {
      foreignKey: 'linking_thread',
      as: 'linked_threads',
    });
  };

  return OffchainThread;
};
