import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ChainAttributes } from './chain';
import { ModelStatic } from './types';

export interface WebhookAttributes {
  url: string;
  categories: string[];
  id?: number;
  chain_id: string;
  created_at?: Date;
  updated_at?: Date;
  Chain?: ChainAttributes;
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
    chain_id: { type: dataTypes.STRING, allowNull: false },
    categories: { type: dataTypes.ARRAY(dataTypes.STRING), allowNull: false, defaultValue: [] },
  }, {
    tableName: 'Webhooks',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['url'] },
      { fields: ['chain_id'] },
    ],
  });

  Webhook.associate = (models) => {
    models.Webhook.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
  };

  return Webhook;
};
