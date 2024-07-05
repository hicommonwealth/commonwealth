import { SsoToken } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type SsoTokenInstance = ModelInstance<z.infer<typeof SsoToken>>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<SsoTokenInstance> =>
  sequelize.define<SsoTokenInstance>(
    'SsoToken',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      issued_at: { type: Sequelize.INTEGER, allowNull: false },
      issuer: { type: Sequelize.STRING, allowNull: false },
      address_id: { type: Sequelize.INTEGER },
      state_id: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE },
      updated_at: { type: Sequelize.DATE },
    },
    {
      tableName: 'SsoTokens',
      underscored: true,
      timestamps: true,
      indexes: [{ fields: ['issuer', 'address_id'] }],
      defaultScope: {
        attributes: {
          exclude: [
            'issued_at',
            'issuer',
            'address_id',
            'state_id',
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
