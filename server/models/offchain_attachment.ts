import * as Sequelize from 'sequelize';
import { BuildOptions, Model, DataTypes } from 'sequelize';

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
extends Model<OffchainAttachmentAttributes>, OffchainAttachmentAttributes {}


type OffchainAttachmentModelStatic = typeof Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: BuildOptions): OffchainAttachmentInstance }

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): OffchainAttachmentModelStatic => {
  const OffchainAttachment = <OffchainAttachmentModelStatic>sequelize.define(
    'OffchainAttachment', {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      attachable: { type: dataTypes.STRING, allowNull: false },
      attachment_id: { type: dataTypes.INTEGER, allowNull: false },
      url: { type: dataTypes.TEXT, allowNull: false },
      description: { type: dataTypes.TEXT, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
      tableName: 'OffchainAttachments',
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
