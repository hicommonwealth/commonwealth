import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { CommunityAttributes } from './communities';
import type { ModelInstance, ModelStatic } from './types';

export type WebhookAttributes = {
  url: string;
  categories: string[];
  id?: number;
  chain_id: string;
  created_at?: Date;
  updated_at?: Date;
  Chain?: CommunityAttributes;
};

export type WebhookInstance = ModelInstance<WebhookAttributes>;

export type WebhookModelStatic = ModelStatic<WebhookInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): WebhookModelStatic => {
  const Webhook = <WebhookModelStatic>sequelize.define(
    'Webhook',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      url: { type: dataTypes.STRING, allowNull: false },
      chain_id: { type: dataTypes.STRING, allowNull: false, field: 'community_id' },
      categories: {
        type: dataTypes.ARRAY(dataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
    },
    {
      tableName: 'Webhooks',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['url'] }, { fields: ['chain_id'] }],
    }
  );

  Webhook.associate = (models) => {
    models.Webhook.belongsTo(models.Community, {
      foreignKey: 'community_id',
      targetKey: 'id',
    });
  };

  return Webhook;
};
