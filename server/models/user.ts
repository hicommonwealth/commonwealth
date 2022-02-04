import * as Sequelize from 'sequelize';
import { CreateOptions, DataTypes, Model } from 'sequelize';
import { ModelStatic } from './types';
import { AddressInstance, AddressAttributes } from './address';
import { ChainAttributes } from './chain';
import { ChainNodeInstance, ChainNodeAttributes } from './chain_node';
import { ProfileInstance, ProfileAttributes } from './profile';
import { SocialAccountInstance, SocialAccountAttributes } from './social_account';
import { DB } from '../database';

export type EmailNotificationInterval = 'daily' | 'never';

export interface UserAttributes {
  email: string;
  id?: number;
  emailVerified?: boolean;
  isAdmin?: boolean;
  lastVisited?: string;
  disableRichText?: boolean;
  emailNotificationInterval?: EmailNotificationInterval;
  magicIssuer?: string;
  lastMagicLoginAt?: number;
  created_at?: Date;
  updated_at?: Date;

  // associations (see https://vivacitylabs.com/setup-typescript-sequelize/)
  selectedNode?: ChainNodeAttributes | ChainNodeAttributes['id'];
  Addresses?: AddressAttributes[] | AddressAttributes['id'][];
  Profiles?: ProfileAttributes[] | ProfileAttributes['id'][];
  SocialAccounts?: SocialAccountAttributes[] | SocialAccountAttributes['id'][];
  Chains?: ChainAttributes[] | ChainAttributes['id'][];
}

// eslint-disable-next-line no-use-before-define
export interface UserInstance extends Model<UserAttributes>, UserCreationAttributes {
  getSelectedNode: Sequelize.BelongsToGetAssociationMixin<ChainNodeInstance>;
  setSelectedNode: Sequelize.BelongsToSetAssociationMixin<ChainNodeInstance, ChainNodeInstance['id']>;

  hasAddresses: Sequelize.HasManyHasAssociationsMixin<AddressInstance, AddressInstance['id']>;
  getAddresses: Sequelize.HasManyGetAssociationsMixin<AddressInstance>;
  setAddresses: Sequelize.HasManySetAssociationsMixin<AddressInstance, AddressInstance['id']>;

  getProfiles: Sequelize.HasManyGetAssociationsMixin<ProfileInstance>;

  getSocialAccounts: Sequelize.HasManyGetAssociationsMixin<SocialAccountInstance>;
  setSocialAccounts: Sequelize.HasManySetAssociationsMixin<SocialAccountInstance, SocialAccountInstance['id']>;
}

export interface UserCreationAttributes extends UserAttributes {
  createWithProfile?: (
    models: DB,
    attrs: UserAttributes,
    options?: CreateOptions,
  ) => Promise<UserInstance>;
}

export type UserModelStatic = ModelStatic<UserInstance> & UserCreationAttributes;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): UserModelStatic => {
  const User = <UserModelStatic>sequelize.define('User', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: dataTypes.STRING },
    emailVerified: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    emailNotificationInterval: {
      type: dataTypes.ENUM,
      values: ['daily', 'never'],
      defaultValue: 'never',
      allowNull: false,
    },
    isAdmin: { type: dataTypes.BOOLEAN, defaultValue: false },
    lastVisited: { type: dataTypes.TEXT, allowNull: false, defaultValue: '{}' },
    disableRichText: { type: dataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    magicIssuer: { type: dataTypes.STRING, allowNull: true },
    lastMagicLoginAt: { type: dataTypes.INTEGER, allowNull: true },
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'Users',
    underscored: false,
    indexes: [
      { fields: ['email'], unique: true },
    ],
    defaultScope: {
      attributes: {
        exclude: [
          'email', 'emailVerified', 'emailNotificationInterval', 'isAdmin',
          'magicIssuer', 'lastMagicLoginAt', 'created_at', 'updated_at'
        ],
      }
    },
    scopes: {
      withPrivateData: {}
    }
  });

  User.createWithProfile = async (
    models: DB,
    attrs: UserAttributes,
    options?: CreateOptions
  ): Promise<UserInstance> => {
    const newUser = await User.create(attrs, options);
    const profile = await models.Profile.create({ user_id: newUser.id }, options);
    newUser.Profiles = [ profile ];
    return newUser;
  };

  User.associate = (models) => {
    models.User.belongsTo(models.ChainNode, { as: 'selectedNode', constraints: false });
    models.User.hasMany(models.Address);
    models.User.hasMany(models.Profile);
    models.User.hasMany(models.SocialAccount);
    models.User.hasMany(models.StarredCommunity);
    models.User.belongsToMany(models.Chain, { through: models.WaitlistRegistration });
  };

  return User;
};
