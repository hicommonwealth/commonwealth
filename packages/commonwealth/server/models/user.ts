import type * as Sequelize from 'sequelize';
import type { CreateOptions, DataTypes } from 'sequelize';
import type { DB } from '../models';
import type { AddressAttributes, AddressInstance } from './address';
import type { ChainAttributes, ChainInstance } from './chain';
import type { ProfileAttributes, ProfileInstance } from './profile';
import type {
  SocialAccountAttributes,
  SocialAccountInstance,
} from './social_account';
import type { ModelInstance, ModelStatic } from './types';

export type EmailNotificationInterval = 'week' | 'never';

export type UserAttributes = {
  email: string;
  id?: number;
  emailVerified?: boolean;
  isAdmin?: boolean;
  lastVisited?: string;
  disableRichText?: boolean;
  emailNotificationInterval?: EmailNotificationInterval;
  selected_chain_id?: number | null;
  created_at?: Date;
  updated_at?: Date;

  // associations (see https://vivacitylabs.com/setup-typescript-sequelize/)
  selectedChain?: ChainAttributes | ChainAttributes['id'];
  Addresses?: AddressAttributes[] | AddressAttributes['id'][];
  Profiles?: ProfileAttributes[];
  SocialAccounts?: SocialAccountAttributes[] | SocialAccountAttributes['id'][];
  Chains?: ChainAttributes[] | ChainAttributes['id'][];
};

// eslint-disable-next-line no-use-before-define
export type UserInstance = ModelInstance<UserAttributes> & {
  getSelectedChain: Sequelize.BelongsToGetAssociationMixin<ChainInstance>;
  setSelectedChain: Sequelize.BelongsToSetAssociationMixin<
    ChainInstance,
    ChainInstance['id']
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

  getSocialAccounts: Sequelize.HasManyGetAssociationsMixin<SocialAccountInstance>;
  setSocialAccounts: Sequelize.HasManySetAssociationsMixin<
    SocialAccountInstance,
    SocialAccountInstance['id']
  >;
};

export type UserCreationAttributes = UserAttributes & {
  createWithProfile?: (
    models: DB,
    attrs: UserAttributes,
    options?: CreateOptions
  ) => Promise<UserInstance>;
};

export type UserModelStatic = ModelStatic<UserInstance> &
  UserCreationAttributes;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): UserModelStatic => {
  const User = <UserModelStatic>sequelize.define(
    'User',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      email: { type: dataTypes.STRING },
      emailVerified: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      emailNotificationInterval: {
        type: dataTypes.STRING,
        defaultValue: 'never',
        allowNull: false,
      },
      isAdmin: { type: dataTypes.BOOLEAN, defaultValue: false },
      lastVisited: {
        type: dataTypes.TEXT,
        allowNull: false,
        defaultValue: '{}',
      },
      disableRichText: {
        type: dataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      selected_chain_id: { type: dataTypes.STRING, allowNull: true },
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
    }
  );

  User.createWithProfile = async (
    models: DB,
    attrs: UserAttributes,
    options?: CreateOptions
  ): Promise<UserInstance> => {
    const newUser = await User.create(attrs, options);
    const profile = await models.Profile.create(
      {
        user_id: newUser.id,
      },
      options
    );
    newUser.Profiles = [profile];
    return newUser;
  };

  User.associate = (models) => {
    models.User.belongsTo(models.Chain, {
      as: 'selectedChain',
      foreignKey: 'selected_chain_id',
      constraints: false,
    });
    models.User.hasMany(models.Address);
    models.User.hasMany(models.Profile);
    models.User.hasMany(models.SocialAccount);
    models.User.hasMany(models.StarredCommunity);
  };

  return User;
};
