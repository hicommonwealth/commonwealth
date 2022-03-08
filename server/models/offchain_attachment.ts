import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { OffchainCommentAttributes } from './offchain_comment';
import { OffchainThreadAttributes } from './offchain_thread';

export type OffchainAttachmentAttributes = {
  attachable: string;
  attachment_id: number;
  url: string;
  description: string;
  id?: number;
  created_at?: Date;
  updated_at?: Date;

  // associations
  comment?: OffchainCommentAttributes | OffchainCommentAttributes['id'];
  thread?: OffchainThreadAttributes | OffchainThreadAttributes['id'];
};

export type OffchainAttachmentInstance =
  ModelInstance<OffchainAttachmentAttributes>;

export type OffchainAttachmentModelStatic =
  ModelStatic<OffchainAttachmentInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): OffchainAttachmentModelStatic => {
  const OffchainAttachment = <OffchainAttachmentModelStatic>sequelize.define(
    'OffchainAttachment',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      attachable: { type: dataTypes.STRING, allowNull: false },
      attachment_id: { type: dataTypes.INTEGER, allowNull: false },
      url: { type: dataTypes.TEXT, allowNull: false },
      description: { type: dataTypes.TEXT, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'OffchainAttachments',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['attachable', 'attachment_id'] }],
    }
  );

  OffchainAttachment.associate = (models) => {
    models.OffchainAttachment.belongsTo(models.OffchainComment, {
      foreignKey: 'attachment_id',
      constraints: false,
      as: 'comment',
    });
    models.OffchainAttachment.belongsTo(models.OffchainThread, {
      foreignKey: 'attachment_id',
      constraints: false,
      as: 'thread',
    });
  };

  return OffchainAttachment;
};
