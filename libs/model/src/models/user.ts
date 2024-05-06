import { User } from '@hicommonwealth/schemas';
import type { CreateOptions } from 'sequelize';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { AddressAttributes, AddressInstance } from './address';
import type { CommentSubscriptionAttributes } from './comment_subscriptions';
import type { CommunityAttributes, CommunityInstance } from './community';
import type { CommunityAlertAttributes } from './community_alerts';
import type { ProfileAttributes, ProfileInstance } from './profile';
import type { SubscriptionPreferenceAttributes } from './subscription_preference';
import type { ThreadSubscriptionAttributes } from './thread_subscriptions';
import type { ModelInstance, ModelStatic } from './types';

export type EmailNotificationInterval = 'weekly' | 'never';

export type UserAttributes = z.infer<typeof User> & {
  // associations (see https://vivacitylabs.com/setup-typescript-sequelize/)
  selectedCommunity?: CommunityAttributes | CommunityAttributes['id'];
  Addresses?: AddressAttributes[] | AddressAttributes['id'][];
  Profiles?: ProfileAttributes[];
  Communities?: CommunityAttributes[] | CommunityAttributes['id'][];
  SubscriptionPreferences?: SubscriptionPreferenceAttributes;
  CommunityAlerts?: CommunityAlertAttributes[];
  ThreadSubscriptions?: ThreadSubscriptionAttributes[];
  CommentSubscriptions?: CommentSubscriptionAttributes[];
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

  getProfiles: Sequelize.HasManyGetAssociationsMixin<ProfileInstance>;
};

export type UserCreationAttributes = UserAttributes & {
  createWithProfile?: (
    attrs: UserAttributes,
    options?: CreateOptions,
  ) => Promise<UserInstance>;
};

export type UserModelStatic = ModelStatic<UserInstance> &
  UserCreationAttributes;

export default (sequelize: Sequelize.Sequelize): UserModelStatic => {
  const User = <UserModelStatic>sequelize.define<UserInstance>(
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
      isAdmin: { type: Sequelize.BOOLEAN, defaultValue: false },
      disableRichText: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      selected_community_id: { type: Sequelize.STRING, allowNull: true },
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
          ],
        },
      },
      scopes: {
        withPrivateData: {},
      },
    },
  );

  User.associate = (models) => {
    models.User.hasMany(models.Profile, {
      foreignKey: { name: 'user_id', allowNull: false },
    });

    User.createWithProfile = async (
      attrs: UserAttributes,
      options?: CreateOptions,
    ): Promise<UserInstance> => {
      const newUser = await User.create(attrs, options);
      const profile = await models.Profile.create(
        {
          user_id: newUser.id!,
        },
        options,
      );
      newUser.Profiles = [profile];
      return newUser;
    };
  };

  return User;
};
