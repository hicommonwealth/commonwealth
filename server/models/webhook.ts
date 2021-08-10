import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ChainAttributes } from './chain';
import { OffchainCommunityAttributes } from './offchain_community';
import { ModelStatic } from './types';

export interface WebhookAttributes {
  url: string;
  categories: string[];
  id?: number;
  chain_id?: string;
  offchain_community_id?: string;
  created_at?: Date;
  updated_at?: Date;
  Chain?: ChainAttributes;
  OffchainCommunity?: OffchainCommunityAttributes;
}

export interface WebhookInstance extends Model<WebhookAttributes>, WebhookAttributes {}

export type WebhookModelStatic = ModelStatic<WebhookInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): WebhookModelStatic => {
  const Webhook = <WebhookModelStatic>sequelize.define('Webhook', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    url: { type: dataTypes.STRING, allowNull: false },
    chain_id: { type: dataTypes.STRING, allowNull: true },
    offchain_community_id: { type: dataTypes.STRING, allowNull: true },
    categories: { type: dataTypes.ARRAY(dataTypes.STRING), allowNull: false, defaultValue: [] },
  }, {
    tableName: 'Webhooks',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['url'] },
      { fields: ['chain_id'] },
      { fields: ['offchain_community_id'] },
    ],
    validate: {
      // webhooks should only have 1 of these properties
      eitherOffchainOrOnchain() {
        if (!this.chain_id && !this.offchain_community_id) {
          throw new Error('Either chain_id or offchain_community_id!');
        }
        if (this.chain_id && this.offchain_community_id) {
          throw new Error('Either chain_id or offchain_community_id not both!');
        }
      }
    }
  });

  Webhook.associate = (models) => {
    models.Webhook.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
    models.Webhook.belongsTo(models.OffchainCommunity, { foreignKey: 'offchain_community_id', targetKey: 'id' });
  };

  return Webhook;
};
