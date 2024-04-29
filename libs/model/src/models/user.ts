import { schemas } from '@hicommonwealth/core';
import type * as Sequelize from 'sequelize';
import type { CreateOptions } from 'sequelize';
import { z } from 'zod';
import type { AddressAttributes, AddressInstance } from './address';
import type { CommunityAttributes, CommunityInstance } from './community';
import { CommunityAlertAttributes } from './community_alerts';
import type { ProfileAttributes, ProfileInstance } from './profile';
import { SubscriptionPreferenceAttributes } from './subscription_preference';
import type { DataTypes, ModelInstance, ModelStatic } from './types';

export type EmailNotificationInterval = 'weekly' | 'never';

export type UserAttributes = z.infer<typeof schemas.entities.User> & {
  // associations (see https://vivacitylabs.com/setup-typescript-sequelize/)
  selectedCommunity?: CommunityAttributes | CommunityAttributes['id'];
  Addresses?: AddressAttributes[] | AddressAttributes['id'][];
  Profiles?: ProfileAttributes[];
  Communities?: CommunityAttributes[] | CommunityAttributes['id'][];
  SubscriptionPreferences?: SubscriptionPreferenceAttributes;
  CommunityAlerts?: CommunityAlertAttributes[];
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

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: DataTypes,
): UserModelStatic => {
  const User = <UserModelStatic>sequelize.define(
    'User',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      email: { type: dataTypes.STRING, allowNull: true },
      emailVerified: {
        type: dataTypes.BOOLEAN,
        allowNull: true,
      },
      emailNotificationInterval: {
        type: dataTypes.STRING,
        defaultValue: 'never',
        allowNull: false,
      },
      isAdmin: { type: dataTypes.BOOLEAN, defaultValue: false },
      disableRichText: {
        type: dataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      selected_community_id: { type: dataTypes.STRING, allowNull: true },
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
    models.User.belongsTo(models.Community, {
      as: 'selectedCommunity',
      foreignKey: 'selected_community_id',
      //constraints: false,
    });
    models.User.hasMany(models.Address);
    models.User.hasMany(models.Profile, {
      foreignKey: { name: 'user_id', allowNull: false },
    });
    models.User.hasMany(models.StarredCommunity, {
      foreignKey: 'user_id',
      sourceKey: 'id',
    });
    models.User.hasOne(models.SubscriptionPreference, {
      foreignKey: 'user_id',
      as: 'SubscriptionPreferences',
    });
    models.User.hasMany(models.CommunityAlert, {
      foreignKey: 'user_id',
      as: 'CommunityAlerts',
    });
    models.User.hasMany(models.ThreadSubscription, {
      foreignKey: 'user_id',
      as: 'ThreadSubscriptions',
    });
    models.User.hasMany(models.CommentSubscription, {
      foreignKey: 'user_id',
      as: 'CommentSubscriptions',
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
