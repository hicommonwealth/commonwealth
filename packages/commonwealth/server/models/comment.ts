import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';

import type { AddressAttributes } from './address';
import type { AttachmentAttributes } from './attachment';
import type { ChainAttributes } from './chain';
import type { ModelInstance, ModelStatic } from './types';

export type CommentAttributes = {
  thread_id: string;
  address_id: number;
  text: string;
  plaintext: string;
  id?: number;
  chain: string;
  parent_id?: string;
  version_history?: string[];

  canvas_action: string;
  canvas_session: string;
  canvas_hash: string;

  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;

  // associations
  Chain?: ChainAttributes;
  Address?: AddressAttributes;
  Attachments?: AttachmentAttributes[] | AttachmentAttributes['id'][];
};

export type CommentInstance = ModelInstance<CommentAttributes>;

export type CommentModelStatic = ModelStatic<CommentInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): CommentModelStatic => {
  const Comment = <CommentModelStatic>sequelize.define(
    'Comment',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      chain: { type: dataTypes.STRING, allowNull: false },
      thread_id: { type: dataTypes.INTEGER, allowNull: false },
      parent_id: { type: dataTypes.STRING, allowNull: true },
      address_id: { type: dataTypes.INTEGER, allowNull: false },
      text: { type: dataTypes.TEXT, allowNull: false },
      plaintext: { type: dataTypes.TEXT, allowNull: true },
      version_history: {
        type: dataTypes.ARRAY(dataTypes.TEXT),
        defaultValue: [],
        allowNull: false,
      },
      // signed data
      canvas_action: { type: dataTypes.JSONB, allowNull: true },
      canvas_session: { type: dataTypes.JSONB, allowNull: true },
      canvas_hash: { type: dataTypes.STRING, allowNull: true },
      // timestamps
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
      deleted_at: { type: dataTypes.DATE, allowNull: true },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      tableName: 'Comments',
      underscored: true,
      paranoid: true,
      indexes: [
        { fields: ['id'] },
        { fields: ['chain', 'thread_id'] },
        { fields: ['address_id'] },
        { fields: ['chain', 'created_at'] },
        { fields: ['chain', 'updated_at'] },
        { fields: ['thread_id'] },
        { fields: ['canvas_hash'] },
      ],
    }
  );

  Comment.associate = (models) => {
    models.Comment.belongsTo(models.Chain, {
      foreignKey: 'chain',
      targetKey: 'id',
    });
    models.Comment.belongsTo(models.Thread, {
      foreignKey: 'thread_id',
      targetKey: 'id',
    });
    models.Comment.belongsTo(models.Address, {
      foreignKey: 'address_id',
      targetKey: 'id',
    });
    models.Comment.hasMany(models.Attachment, {
      foreignKey: 'attachment_id',
      constraints: false,
      scope: {
        attachable: 'comment',
      },
    });
    models.Comment.hasMany(models.Reaction, {
      foreignKey: 'comment_id',
      as: 'reactions',
    });
  };

  return Comment;
};
