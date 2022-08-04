import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { AddressAttributes } from './address';
import { ChainAttributes } from './chain';
import { AttachmentAttributes } from './attachment';
import { LinkedThreadAttributes } from './linked_thread';
import { TopicAttributes } from './topic';
import { ChainEntityMetaAttributes } from "./chain_entity_meta";

export type ThreadAttributes = {
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
  chain_entity_id?: number

  read_only?: boolean;
  version_history?: string[];
  snapshot_proposal?: string;

  has_poll?: boolean;

  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
  last_commented_on?: Date;

  // associations
  Chain?: ChainAttributes;
  ChainEntityTile: ChainEntityMetaAttributes;
  Address?: AddressAttributes;
  Attachments?:
    | AttachmentAttributes[]
    | AttachmentAttributes['id'][];
  collaborators?: AddressAttributes[];
  linked_threads?: LinkedThreadAttributes[];
  topic?: TopicAttributes;
};

export type ThreadInstance = ModelInstance<ThreadAttributes> & {
  // no mixins used
};

export type ThreadModelStatic = ModelStatic<ThreadInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ThreadModelStatic => {
  const Thread = <ThreadModelStatic>sequelize.define(
    'Thread',
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
      chain_entity_id: { type: dataTypes.INTEGER, allowNull: true },
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

      has_poll: { type: dataTypes.BOOLEAN, allowNull: true },

      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
      deleted_at: { type: dataTypes.DATE, allowNull: true },
      last_commented_on: { type: dataTypes.DATE, allowNull: true },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      underscored: true,
      tableName: 'Threads',
      paranoid: true,
      indexes: [
        { fields: ['address_id'] },
        { fields: ['chain'] },
        { fields: ['chain', 'created_at'] },
        { fields: ['chain', 'updated_at'] },
        { fields: ['chain', 'pinned'] },
        { fields: ['chain', 'has_poll'] },
      ],
    }
  );

  Thread.associate = (models) => {
    models.Thread.belongsTo(models.Chain, {
      foreignKey: 'chain',
      targetKey: 'id',
    });
    models.Thread.belongsTo(models.Address, {
      as: 'Address',
      foreignKey: 'address_id',
      targetKey: 'id',
    });
    models.Thread.hasMany(models.Attachment, {
      foreignKey: 'attachment_id',
      constraints: false,
      scope: { attachable: 'thread' },
    });
    models.Thread.belongsTo(models.Topic, {
      as: 'topic',
      foreignKey: 'topic_id',
    });
    models.Thread.belongsToMany(models.Role, {
      through: 'read_only_roles_threads',
      as: 'read_only_roles',
      foreignKey: 'thread_id',
      otherKey: 'id',
    });
    models.Thread.belongsToMany(models.Address, {
      through: models.Collaboration,
      as: 'collaborators',
    });
    models.Thread.hasMany(models.Reaction, {
      foreignKey: 'thread_id',
      as: 'reactions',
    });
    models.Thread.hasMany(models.Collaboration);
    models.Thread.hasMany(models.LinkedThread, {
      foreignKey: 'linked_thread',
      as: 'linking_threads',
    });
    models.Thread.hasMany(models.LinkedThread, {
      foreignKey: 'linking_thread',
      as: 'linked_threads',
    });
    models.Thread.hasMany(models.Poll, {
      foreignKey: 'thread_id',
    });
    models.Thread.hasOne(models.ChainEntityMeta, {
      foreignKey: 'id'
    })
  };

  return Thread;
};
