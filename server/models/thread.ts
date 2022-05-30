import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { AddressAttributes } from './address';
import { CommunityAttributes } from './community';
import { AttachmentAttributes } from './attachment';
import { ChainEntityAttributes } from './chain_entity';
import { LinkedThreadAttributes } from './linked_thread';

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
  community_id: string;

  read_only?: boolean;
  version_history?: string[];
  snapshot_proposal?: string;

  has_poll?: boolean;

  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
  last_commented_on?: Date;

  // associations
  Community?: CommunityAttributes;
  Address?: AddressAttributes;
  Attachments?:
    | AttachmentAttributes[]
    | AttachmentAttributes['id'][];
  ChainEntity?: ChainEntityAttributes;
  collaborators?: AddressAttributes[];
  linked_threads?: LinkedThreadAttributes[];
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
      community_id: { type: dataTypes.STRING, allowNull: false },
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
        { fields: ['community_id'] },
        { fields: ['community_id', 'created_at'] },
        { fields: ['community_id', 'updated_at'] },
        { fields: ['community_id', 'pinned'] },
        { fields: ['community_id', 'has_poll'] },
      ],
    }
  );

  Thread.associate = (models) => {
    models.Thread.belongsTo(models.Community, {
      foreignKey: 'community_id',
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
    models.Thread.hasMany(models.ChainEntity, {
      foreignKey: 'thread_id',
      constraints: false,
    });
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
  };

  return Thread;
};
