import Sequelize from 'sequelize';
import type { AddressAttributes } from './address';
import type { ModelInstance, ModelStatic } from './types';

export type SsoTokenAttributes = {
  id?: number;
  issued_at?: number;
  issuer?: string;
  address_id?: number;
  profile_id?: number;
  state_id?: string;
  created_at?: Date;
  updated_at?: Date;
  Address?: AddressAttributes;
};

export type SsoTokenInstance = ModelInstance<SsoTokenAttributes>;

export type SsoTokenModelStatic = ModelStatic<SsoTokenInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <SsoTokenModelStatic>sequelize.define<SsoTokenInstance>(
    'SsoToken',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      issued_at: { type: Sequelize.INTEGER, allowNull: true },
      issuer: { type: Sequelize.STRING, allowNull: true },
      address_id: { type: Sequelize.INTEGER, allowNull: true },
      profile_id: { type: Sequelize.INTEGER, allowNull: true },
      state_id: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'SsoTokens',
      underscored: true,
      timestamps: true,
      indexes: [{ fields: ['id'] }, { fields: ['issuer', 'address_id'] }],
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
