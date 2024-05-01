import crypto from 'crypto';
import Sequelize from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';

export const LOGIN_TOKEN_EXPIRES_IN = 30;

export type LoginTokenAttributes = {
  token: string;
  expires: Date;
  id?: number;
  email?: string;
  redirect_path?: string;
  domain?: string;
  used?: Date;

  created_at?: Date;
  updated_at?: Date;
};

export type LoginTokenInstance = ModelInstance<LoginTokenAttributes>;

export type LoginTokenCreationAttributes = LoginTokenAttributes & {
  createForEmail?: (
    email: string,
    path?: string,
  ) => Promise<LoginTokenInstance>;
};

export type LoginTokenModelStatic = ModelStatic<LoginTokenInstance> &
  LoginTokenCreationAttributes;

export default (sequelize: Sequelize.Sequelize): LoginTokenModelStatic => {
  const LoginToken = <LoginTokenModelStatic>sequelize.define(
    'LoginToken',
    {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      token: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false },
      expires: { type: Sequelize.DATE, allowNull: false },
      redirect_path: { type: Sequelize.STRING, allowNull: true },
      domain: { type: Sequelize.STRING, allowNull: true },
      used: { type: Sequelize.DATE, allowNull: true },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'LoginTokens',
      underscored: true,
      indexes: [{ fields: ['token', 'email'] }],
    },
  );

  LoginToken.createForEmail = async (
    email: string,
    path?: string,
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

  return LoginToken;
};
