import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { CommentAttributes } from './comment';
import { OffchainThreadAttributes } from './offchain_thread';

export type AttachmentAttributes = {
  attachable: string;
  attachment_id: number;
  url: string;
  description: string;
  id?: number;
  created_at?: Date;
  updated_at?: Date;

  // associations
  comment?: CommentAttributes | CommentAttributes['id'];
  thread?: OffchainThreadAttributes | OffchainThreadAttributes['id'];
}

export type AttachmentInstance = ModelInstance<AttachmentAttributes>;

export type AttachmentModelStatic = ModelStatic<AttachmentInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): AttachmentModelStatic => {
  const Attachment = <AttachmentModelStatic>sequelize.define(
    'Attachment', {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      attachable: { type: dataTypes.STRING, allowNull: false },
      attachment_id: { type: dataTypes.INTEGER, allowNull: false },
      url: { type: dataTypes.TEXT, allowNull: false },
      description: { type: dataTypes.TEXT, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
      tableName: 'Attachments',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['attachable', 'attachment_id'] },
      ],
    }
  );

  Attachment.associate = (models) => {
    models.Attachment.belongsTo(models.Comment, {
      foreignKey: 'attachment_id',
      constraints: false,
      as: 'comment',
    });
    models.Attachment.belongsTo(models.OffchainThread, {
      foreignKey: 'attachment_id',
      constraints: false,
      as: 'thread',
    });
  };

  return Attachment;
};
