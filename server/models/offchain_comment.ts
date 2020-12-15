import * as Sequelize from 'sequelize';

import { AddressAttributes } from './address';
import { ChainAttributes } from './chain';
import { OffchainCommunityAttributes } from './offchain_community';
import { OffchainAttachmentAttributes } from './offchain_attachment';

export interface OffchainCommentAttributes {
  id?: number;
  chain?: string;
  root_id: string;
  parent_id?: string;
  child_comments?: number[];
  address_id: number;
  text: string;
  plaintext: string;
  community?: string;
  version_history?: string[];
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;

  // associations
  Chain?: ChainAttributes;
  OffchainCommunity?: OffchainCommunityAttributes;
  Address?: AddressAttributes;
  OffchainAttachments?: OffchainAttachmentAttributes[] | OffchainAttachmentAttributes['id'][];
}

export interface OffchainCommentInstance
extends Sequelize.Instance<OffchainCommentAttributes>, OffchainCommentAttributes {
  // no mixins used
}

export interface OffchainCommentModel extends Sequelize.Model<OffchainCommentInstance, OffchainCommentAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): OffchainCommentModel => {
  const OffchainComment = sequelize.define<OffchainCommentInstance, OffchainCommentAttributes>('OffchainComment', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    chain: { type: dataTypes.STRING, allowNull: true },
    root_id: { type: dataTypes.STRING, allowNull: false },
    parent_id: { type: dataTypes.STRING, allowNull: true },
    child_comments: { type: dataTypes.ARRAY(dataTypes.INTEGER), allowNull: false, defaultValue: [] },
    address_id: { type: dataTypes.INTEGER, allowNull: false },
    text: { type: dataTypes.TEXT, allowNull: false },
    plaintext: { type: dataTypes.TEXT, allowNull: true },
    community: { type: dataTypes.STRING, allowNull: true },
    version_history: { type: dataTypes.ARRAY(dataTypes.TEXT), defaultValue: [], allowNull: false },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
    deleted_at: { type: dataTypes.DATE, allowNull: true },
  }, {
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['id'] },
      { fields: ['chain', 'root_id'] },
      { fields: ['address_id'] },
    ],
  });

  OffchainComment.associate = (models) => {
    models.OffchainComment.belongsTo(models.Chain, {
      foreignKey: 'chain',
      targetKey: 'id'
    });
    models.OffchainComment.belongsTo(models.OffchainCommunity, {
      foreignKey: 'community',
      targetKey: 'id'
    });
    models.OffchainComment.belongsTo(models.Address, {
      foreignKey: 'address_id',
      targetKey: 'id'
    });
    models.OffchainComment.hasMany(models.OffchainAttachment, {
      foreignKey: 'attachment_id',
      constraints: false,
      scope: {
        attachable: 'comment',
      },
    });
  };

  return OffchainComment;
};
