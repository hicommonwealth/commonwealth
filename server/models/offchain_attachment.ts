import * as Sequelize from 'sequelize';

import { OffchainCommentAttributes } from './offchain_comment';
import { OffchainThreadAttributes } from './offchain_thread';

export interface OffchainAttachmentAttributes {
  id?: number;
  attachable: string;
  attachment_id: number;
  url: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;

  // associations
  comment?: OffchainCommentAttributes | OffchainCommentAttributes['id'];
  thread?: OffchainThreadAttributes | OffchainThreadAttributes['id'];
}

export interface OffchainAttachmentInstance
extends Sequelize.Instance<OffchainAttachmentAttributes>, OffchainAttachmentAttributes {

}

export interface OffchainAttachmentModel extends Sequelize.Model<
  OffchainAttachmentInstance, OffchainAttachmentAttributes
> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): OffchainAttachmentModel => {
  const OffchainAttachment = sequelize.define<OffchainAttachmentInstance, OffchainAttachmentAttributes>(
    'OffchainAttachment', {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      attachable: { type: dataTypes.STRING, allowNull: false },
      attachment_id: { type: dataTypes.INTEGER, allowNull: false },
      url: { type: dataTypes.TEXT, allowNull: false },
      description: { type: dataTypes.TEXT, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
      underscored: true,
      indexes: [
        { fields: ['attachable', 'attachment_id'] },
      ],
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
