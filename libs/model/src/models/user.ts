import { User } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { AddressAttributes, AddressInstance } from './address';
import type { CommentSubscriptionAttributes } from './comment_subscriptions';
import type { CommunityAttributes, CommunityInstance } from './community';
import type { CommunityAlertAttributes } from './community_alerts';
import type { SubscriptionPreferenceAttributes } from './subscription_preference';
import type { ThreadSubscriptionAttributes } from './thread_subscriptions';
import type { ModelInstance } from './types';

export type EmailNotificationInterval = 'weekly' | 'never';

export type UserAttributes = z.infer<typeof User> & {
  // associations (see https://vivacitylabs.com/setup-typescript-sequelize/)
  selectedCommunity?: CommunityAttributes | CommunityAttributes['id'];
  Addresses?: AddressAttributes[] | AddressAttributes['id'][];
  Communities?: CommunityAttributes[] | CommunityAttributes['id'][];
  SubscriptionPreferences?: SubscriptionPreferenceAttributes;
  threadSubscriptions?: ThreadSubscriptionAttributes[];
  commentSubscriptions?: CommentSubscriptionAttributes[];
  communityAlerts?: CommunityAlertAttributes[];
};

// eslint-disable-next-line no-use-before-define
export type UserInstance = ModelInstance<UserAttributes> & {
  getSelectedCommunity: Sequelize.BelongsToGetAssociationMixin<CommunityInstance>;
  setSelectedCommunity: Sequelize.BelongsToSetAssociationMixin<
    CommunityInstance,
    CommunityInstance['id']
  >;

  hasAddresses: Sequelize.HasManyHasAssociationsMixin<
    AddressInstance,
    AddressInstance['id']
  >;
  getAddresses: Sequelize.HasManyGetAssociationsMixin<AddressInstance>;
  setAddresses: Sequelize.HasManySetAssociationsMixin<
    AddressInstance,
    AddressInstance['id']
  >;
};

export type UserModelStatic = Sequelize.ModelStatic<UserInstance>;

export default (sequelize: Sequelize.Sequelize): UserModelStatic =>
  <UserModelStatic>sequelize.define<UserInstance>(
    'User',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      email: { type: Sequelize.STRING, allowNull: true },
      emailVerified: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      emailNotificationInterval: {
        type: Sequelize.STRING,
        defaultValue: 'never',
        allowNull: false,
      },
      promotional_emails_enabled: { type: Sequelize.BOOLEAN, allowNull: true },
      is_welcome_onboard_flow_complete: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isAdmin: { type: Sequelize.BOOLEAN, defaultValue: false },
      disableRichText: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      selected_community_id: { type: Sequelize.STRING, allowNull: true },
      profile: { type: Sequelize.JSONB, allowNull: false },
      xp_points: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: true },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'Users',
      underscored: false,
      indexes: [{ fields: ['email'], unique: true }],
      defaultScope: {
        attributes: {
          exclude: [
            'emailVerified',
            'emailNotificationInterval',
            'isAdmin',
            'created_at',
            'updated_at',
            'hashed_api_key',
          ],
        },
      },
      scopes: {
        withPrivateData: {},
      },
    },
  );
