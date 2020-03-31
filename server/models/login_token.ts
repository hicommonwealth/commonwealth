import crypto from 'crypto';
import { LOGIN_TOKEN_EXPIRES_IN } from '../config';

module.exports = (sequelize, DataTypes) => {
  const LoginToken = sequelize.define('LoginToken', {
    token: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: true },
    expires: { type: DataTypes.DATE, allowNull: false },
    redirect_path: { type: DataTypes.STRING, allowNull: true },
    used: { type: DataTypes.DATE },
  }, {
    underscored: true,
    indexes: [
      { fields: ['token', 'email'] },
    ],
  });

  LoginToken.createForEmail = async (email, path?) => {
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
