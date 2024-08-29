console.log('LOADING src/models/email_update_token.ts START');
import crypto from 'crypto';
import Sequelize from 'sequelize';
import type { ModelInstance } from './types';

export const TOKEN_EXPIRES_IN = 30;

export type EmailUpdateTokenAttributes = {
  token: string;
  expires: Date;
  id?: number;
  email?: string;
  redirect_path?: string;

  created_at?: Date;
  updated_at?: Date;
};

export type EmailUpdateTokenInstance =
  ModelInstance<EmailUpdateTokenAttributes>;
export type EmailUpdateTokenModelStatic =
  Sequelize.ModelStatic<EmailUpdateTokenInstance> & {
    createForEmail?: (
      email: string,
      path?: string,
    ) => Promise<EmailUpdateTokenInstance>;
  };

export default (
  sequelize: Sequelize.Sequelize,
): EmailUpdateTokenModelStatic => {
  const EmailUpdateToken = <EmailUpdateTokenModelStatic>(
    sequelize.define<EmailUpdateTokenInstance>(
      'EmailUpdateToken',
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        token: { type: Sequelize.STRING, allowNull: false },
        email: { type: Sequelize.STRING, allowNull: false },
        expires: { type: Sequelize.DATE, allowNull: false },
        redirect_path: { type: Sequelize.STRING, allowNull: true },
      },
      {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: 'EmailUpdateTokens',
        underscored: true,
        indexes: [{ fields: ['token', 'email'] }],
      },
    )
  );

  EmailUpdateToken.createForEmail = async (email: string, path?: string) => {
    const token = crypto.randomBytes(24).toString('hex');
    const expires = new Date(+new Date() + TOKEN_EXPIRES_IN * 60 * 1000);
    return await EmailUpdateToken.create({
      email,
      expires,
      token,
      redirect_path: path,
    });
  };

  return EmailUpdateToken;
};

console.log('LOADING src/models/email_update_token.ts END');
