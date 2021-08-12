import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ModelStatic } from './types';

export interface DiscussionDraftAttributes {
  id: number;
  address_id: number;
  title?: string;
  topic?: string;
  body?: string;
  chain?: string;
  community?: string;
  attachment?: string;
}

export interface DiscussionDraftInstance
    extends Model<DiscussionDraftAttributes>, DiscussionDraftAttributes {}

export type DiscussionDraftModelStatic = ModelStatic<DiscussionDraftInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
) => {
  const DiscussionDraft = <DiscussionDraftModelStatic>sequelize.define('DiscussionDraft', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    address_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.TEXT, allowNull: true },
    topic: { type: DataTypes.STRING, allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: true },
    chain: { type: DataTypes.STRING, allowNull: true },
    community: { type: DataTypes.STRING, allowNull: true },
    attachment: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    tableName: 'DiscussionDrafts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      { fields: ['address_id'] },
    ],
  });

  DiscussionDraft.associate = (models) => {
    models.DiscussionDraft.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.DiscussionDraft.belongsTo(models.OffchainCommunity, { foreignKey: 'community', targetKey: 'id' });
    models.DiscussionDraft.belongsTo(models.Address, { foreignKey: 'address_id', targetKey: 'id' });
    models.DiscussionDraft.hasMany(models.OffchainAttachment, {
      foreignKey: 'attachment_id',
      constraints: false,
      scope: { attachable: 'thread' },
    });
  };

  return DiscussionDraft;
};
