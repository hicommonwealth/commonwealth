import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

import { AddressAttributes } from './address';
import { CommunityAttributes } from './community';
import { AttachmentAttributes } from './attachment';

export type CommentAttributes = {
  root_id: string;
  address_id: number;
  text: string;
  plaintext: string;
  id?: number;
  community_id: string;
  parent_id?: string;
  version_history?: string[];
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;

  // associations
  Community?: CommunityAttributes;
  Address?: AddressAttributes;
  Attachments?: AttachmentAttributes[] | AttachmentAttributes['id'][];
}

export type CommentInstance = ModelInstance<CommentAttributes> & {
  // no mixins used
}

export type CommentModelStatic =  ModelStatic<CommentInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): CommentModelStatic => {
  const Comment = <CommentModelStatic>sequelize.define('Comment', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    community_id: { type: dataTypes.STRING, allowNull: false },
    root_id: { type: dataTypes.STRING, allowNull: false },
    parent_id: { type: dataTypes.STRING, allowNull: true },
    address_id: { type: dataTypes.INTEGER, allowNull: false },
    text: { type: dataTypes.TEXT, allowNull: false },
    plaintext: { type: dataTypes.TEXT, allowNull: true },
    version_history: { type: dataTypes.ARRAY(dataTypes.TEXT), defaultValue: [], allowNull: false },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
    deleted_at: { type: dataTypes.DATE, allowNull: true },
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    tableName: 'Comments',
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['id'] },
      { fields: ['community_id', 'root_id'] },
      { fields: ['address_id'] },
      { fields: ['community_id', 'created_at'] },
      { fields: ['community_id', 'updated_at'] },
      { fields: ['root_id'] },
    ],
  });

  Comment.associate = (models) => {
    models.Comment.belongsTo(models.Community, {
      foreignKey: 'community_id',
      targetKey: 'id'
    });
    models.Comment.belongsTo(models.Address, {
      foreignKey: 'address_id',
      targetKey: 'id'
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
      as: 'reactions'
    });
  };

  return Comment;
};
