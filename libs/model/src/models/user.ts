import { User, UserProfile } from '@hicommonwealth/schemas';
import { getRandomAvatar } from '@hicommonwealth/shared';
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
  selectedCommunity?: CommunityAttributes;
  Addresses?: AddressAttributes[];
  Communities?: CommunityAttributes[];
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
      tier: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
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
      xp_referrer_points: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: true,
      },
      unsubscribe_uuid: { type: Sequelize.STRING, allowNull: true },
      referred_by_address: { type: Sequelize.STRING, allowNull: true },
      referral_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: true,
      },
      referral_eth_earnings: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      privy_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notify_user_name_change: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'Users',
      underscored: false,
      indexes: [
        { fields: ['email'], unique: true },
        { fields: ['privy_id'], unique: true },
        { fields: ['xp_points'], unique: false },
      ],
      defaultScope: {
        attributes: {
          exclude: [
            'emailVerified',
            'emailNotificationInterval',
            'isAdmin',
            'created_at',
            'updated_at',
            'unsubscribe_uuid',
          ],
        },
      },
      scopes: {
        withPrivateData: {},
      },
      validate: {
        definedAvatarUrl() {
          if (
            this.profile &&
            !(this.profile as z.infer<typeof UserProfile>)?.avatar_url
          ) {
            throw new Error('profile.avatar_url must be defined');
          }
        },
      },
      hooks: {
        beforeValidate(instance: UserInstance) {
          if (instance.profile && !instance.profile.avatar_url) {
            instance.profile.avatar_url = getRandomAvatar();
          }
        },
      },
    },
  );
