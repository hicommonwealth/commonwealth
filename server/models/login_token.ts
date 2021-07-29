import * as Sequelize from 'sequelize';
import { BuildOptions, Model, DataTypes } from 'sequelize';

import crypto from 'crypto';
import { LOGIN_TOKEN_EXPIRES_IN } from '../config';
import { SocialAccountAttributes } from './social_account';

export interface LoginTokenAttributes {
  id?: number;
  token: string;
  email?: string;
  expires: Date;
  redirect_path?: string;
  used?: Date;

  created_at?: Date;
  updated_at?: Date;

  // associations
  SocialAccounts?: SocialAccountAttributes[];
}

export interface LoginTokenInstance extends Model<LoginTokenAttributes>, LoginTokenAttributes {
  // no mixins used yet
}

export interface LoginTokenCreationAttributes extends LoginTokenAttributes {
   createForEmail?: (email: string, path?: string) => Promise<LoginTokenInstance>;
}

type LoginTokenModelStatic = typeof Model
    & { associate: (models: any) => void }
    & LoginTokenCreationAttributes
    & { new(values?: Record<string, unknown>, options?: BuildOptions): LoginTokenInstance }

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): LoginTokenModelStatic => {
  const LoginToken = <LoginTokenModelStatic>sequelize.define('LoginToken', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    token: { type: dataTypes.STRING, allowNull: false },
    email: { type: dataTypes.STRING, allowNull: true },
    expires: { type: dataTypes.DATE, allowNull: false },
    redirect_path: { type: dataTypes.STRING, allowNull: true },
    used: { type: dataTypes.DATE, allowNull: true },
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'LoginTokens',
    underscored: true,
    indexes: [
      { fields: ['token', 'email'] },
    ],
  });

  LoginToken.createForEmail = async (email: string, path?: string): Promise<LoginTokenInstance> => {
    const token = crypto.randomBytes(24).toString('hex');
    const expires = new Date(+(new Date()) + LOGIN_TOKEN_EXPIRES_IN * 60 * 1000);
    const result = await LoginToken.create({ email, expires, token, redirect_path: path });
    return result;
  };

  LoginToken.associate = (models) => {
    models.LoginToken.hasMany(models.SocialAccount);
  };

  return LoginToken;
};
