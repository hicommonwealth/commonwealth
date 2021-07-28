import * as Sequelize from 'sequelize';
import { BuildOptions, DataTypes, Model } from 'sequelize';
import { ChainAttributes } from './chain';
import { OffchainCommunityAttributes } from './offchain_community';

export interface WebhookAttributes {
  id?: number;
  url: string;
  chain_id?: string;
  offchain_community_id?: string;
  categories: string[];
  created_at?: Date;
  updated_at?: Date;
  Chain?: ChainAttributes;
  OffchainCommunity?: OffchainCommunityAttributes;
}

export interface WebhookInstance extends Model<WebhookAttributes>, WebhookAttributes {}

type WebhookModelStatic = typeof Sequelize.Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: Sequelize.BuildOptions): WebhookInstance }

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
