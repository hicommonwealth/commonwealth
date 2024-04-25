import { WebhookCategory } from '@hicommonwealth/shared';
import type * as Sequelize from 'sequelize';
import type { CommunityAttributes } from './community';
import type { DataTypes, ModelInstance, ModelStatic } from './types';

export type WebhookAttributes = {
  url: string;
  categories: WebhookCategory[];
  id?: number;
  community_id: string;
  created_at?: Date;
  updated_at?: Date;
  Chain?: CommunityAttributes;
};

export type WebhookInstance = ModelInstance<WebhookAttributes>;

export type WebhookModelStatic = ModelStatic<WebhookInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: DataTypes,
): WebhookModelStatic => {
  const Webhook = <WebhookModelStatic>sequelize.define(
    'Webhook',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      url: { type: dataTypes.STRING, allowNull: false },
      community_id: { type: dataTypes.STRING, allowNull: false },
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
    },
  );

  Webhook.associate = (models) => {
    models.Webhook.belongsTo(models.Community, {
      foreignKey: 'community_id',
      targetKey: 'id',
    });
  };

  return Webhook;
};
