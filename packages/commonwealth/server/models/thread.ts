import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { AddressAttributes } from './address';
import type { AttachmentAttributes } from './attachment';
import type { ChainAttributes } from './chain';
import type { TopicAttributes } from './topic';
import type { ModelInstance, ModelStatic } from './types';

export enum LinkSource {
  Snapshot = 'snapshot',
  Proposal = 'proposal',
  Thread = 'thread',
  Web = 'web',
}

export type Link = {
  source: LinkSource;
  identifier: string;
  title?: string;
};

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
  view_count: number;
  links: Link[] | null;

  read_only?: boolean;
  version_history?: string[];

  has_poll?: boolean;

  canvas_action: string;
  canvas_session: string;
  canvas_hash: string;

  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
  last_commented_on?: Date;

  // associations
  Chain?: ChainAttributes;
  Address?: AddressAttributes;
  Attachments?: AttachmentAttributes[] | AttachmentAttributes['id'][];
  collaborators?: AddressAttributes[];
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
      view_count: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
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
      links: { type: dataTypes.JSONB, allowNull: true },

      has_poll: { type: dataTypes.BOOLEAN, allowNull: true },

      // signed data
      canvas_action: { type: dataTypes.JSONB, allowNull: true },
      canvas_session: { type: dataTypes.JSONB, allowNull: true },
      canvas_hash: { type: dataTypes.STRING, allowNull: true },
      // timestamps
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
        { fields: ['canvas_hash'] },
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
    models.Thread.belongsToMany(models.Address, {
      through: models.Collaboration,
      as: 'collaborators',
    });
    models.Thread.hasMany(models.Reaction, {
      foreignKey: 'thread_id',
      as: 'reactions',
    });
    models.Thread.hasMany(models.Collaboration);
    models.Thread.hasMany(models.Poll, {
      foreignKey: 'thread_id',
    });
    models.Thread.hasOne(models.ChainEntityMeta, {
      foreignKey: 'id',
    });
  };

  return Thread;
};
