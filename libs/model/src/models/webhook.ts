import { Webhook } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import z from 'zod';
import type { ModelInstance } from './types';

export type WebhookAttributes = z.infer<typeof Webhook>;

export type WebhookInstance = ModelInstance<WebhookAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<WebhookInstance> =>
  sequelize.define<WebhookInstance>(
    'Webhook',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      url: { type: Sequelize.STRING, allowNull: false },
      destination: { type: Sequelize.STRING, allowNull: false },
      community_id: { type: Sequelize.STRING, allowNull: false },
      events: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      signing_key: { type: Sequelize.STRING, allowNull: false },
    },
    {
      tableName: 'Webhooks',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );
