import * as Sequelize from 'sequelize';

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

export interface LoginTokenInstance extends Sequelize.Instance<LoginTokenAttributes>, LoginTokenAttributes {
  // no mixins used yet
}

export interface LoginTokenModel extends Sequelize.Model<LoginTokenInstance, LoginTokenAttributes> {
  createForEmail: (email: string, path?: string) => Promise<LoginTokenInstance>;
}
export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): Sequelize.Model<LoginTokenInstance, LoginTokenAttributes> => {
  const LoginToken = sequelize.define<LoginTokenInstance, LoginTokenAttributes>('LoginToken', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    token: { type: dataTypes.STRING, allowNull: false },
    email: { type: dataTypes.STRING, allowNull: true },
    expires: { type: dataTypes.DATE, allowNull: false },
    redirect_path: { type: dataTypes.STRING, allowNull: true },
    used: { type: dataTypes.DATE, allowNull: true },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
  }, {
    underscored: true,
    indexes: [
      { fields: ['token', 'email'] },
    ],
    classMethods: {
      createForEmail: async (email: string, path?: string): Promise<LoginTokenInstance> => {
        const token = crypto.randomBytes(24).toString('hex');
        const expires = new Date(+(new Date()) + LOGIN_TOKEN_EXPIRES_IN * 60 * 1000);
        const result = await LoginToken.create({ email, expires, token, redirect_path: path });
        return result;
      }
    }
  });

  LoginToken.associate = (models) => {
    models.LoginToken.hasMany(models.SocialAccount);
  };

  return LoginToken;
};
