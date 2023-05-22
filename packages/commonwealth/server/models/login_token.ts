import crypto from 'crypto';
import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import { LOGIN_TOKEN_EXPIRES_IN } from '../config';
import type { SocialAccountAttributes } from './social_account';
import type { ModelInstance, ModelStatic } from './types';

export type LoginTokenAttributes = {
  token: string;
  expires: Date;
  id?: number;
  email?: string;
  redirect_path?: string;
  domain?: string;
  social_account?: number;
  used?: Date;

  created_at?: Date;
  updated_at?: Date;

  // associations
  SocialAccounts?: SocialAccountAttributes[];
};

export type LoginTokenInstance = ModelInstance<LoginTokenAttributes>;

export type LoginTokenCreationAttributes = LoginTokenAttributes & {
  createForEmail?: (
    email: string,
    path?: string
  ) => Promise<LoginTokenInstance>;
  createForOAuth?: (
    domain: string,
    social_account?: number
  ) => Promise<LoginTokenInstance>;
};

export type LoginTokenModelStatic = ModelStatic<LoginTokenInstance> &
  LoginTokenCreationAttributes;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): LoginTokenModelStatic => {
  const LoginToken = <LoginTokenModelStatic>sequelize.define(
    'LoginToken',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      token: { type: dataTypes.STRING, allowNull: false },
      email: { type: dataTypes.STRING, allowNull: false },
      expires: { type: dataTypes.DATE, allowNull: false },
      redirect_path: { type: dataTypes.STRING, allowNull: true },
      domain: { type: dataTypes.STRING, allowNull: true },
      social_account: { type: dataTypes.INTEGER, allowNull: true },
      used: { type: dataTypes.DATE, allowNull: true },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'LoginTokens',
      underscored: true,
      indexes: [{ fields: ['token', 'email'] }],
    }
  );

  LoginToken.createForEmail = async (
    email: string,
    path?: string
  ): Promise<LoginTokenInstance> => {
    const token = crypto.randomBytes(24).toString('hex');
    const expires = new Date(+new Date() + LOGIN_TOKEN_EXPIRES_IN * 60 * 1000);
    const result = await LoginToken.create({
      email,
      expires,
      token,
      redirect_path: path,
    });
    return result;
  };

  // This creates a LoginToken that is tied to no particular email or social account.
  // It is up to the implementer to store the ID of the generated LoginToken on a SocialAccount
  // for it to be looked up later.
  LoginToken.createForOAuth = async (
    domain: string,
    social_account?: number
  ): Promise<LoginTokenInstance> => {
    const token = crypto.randomBytes(24).toString('hex');
    const expires = new Date(+new Date() + LOGIN_TOKEN_EXPIRES_IN * 60 * 1000);
    const result = await LoginToken.create({
      email: '',
      expires,
      token,
      domain,
      social_account,
    });
    return result;
  };

  LoginToken.associate = (models) => {
    models.LoginToken.hasMany(models.SocialAccount);
  };

  return LoginToken;
};
