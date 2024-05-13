import { WebhookCategory } from '@hicommonwealth/shared';
import Sequelize from 'sequelize';
import type { CommunityAttributes } from './community';
import type { ModelInstance } from './types';

export type WebhookAttributes = {
  url: string;
  categories: WebhookCategory[];
  id?: number;
  community_id: string;
  created_at?: Date;
  updated_at?: Date;
  Community?: CommunityAttributes;
};

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
      community_id: { type: Sequelize.STRING, allowNull: false },
      categories: {
        type: Sequelize.ARRAY(Sequelize.STRING),
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
