import type * as Sequelize from 'sequelize';
import type { AddressAttributes } from './address';
import type { DataTypes, ModelInstance, ModelStatic } from './types';

export type SsoTokenAttributes = {
  id?: number;
  issued_at?: number;
  issuer?: string;
  address_id?: number;
  profile_id?: number;
  state_id?: string;
  created_at?: Date;
  updated_at?: Date;
  Address: AddressAttributes;
};

export type SsoTokenInstance = ModelInstance<SsoTokenAttributes>;

export type SsoTokenModelStatic = ModelStatic<SsoTokenInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: DataTypes,
): SsoTokenModelStatic => {
  const SsoToken = <SsoTokenModelStatic>sequelize.define(
    'SsoToken',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      issued_at: { type: dataTypes.INTEGER, allowNull: true },
      issuer: { type: dataTypes.STRING, allowNull: true },
      address_id: { type: dataTypes.INTEGER, allowNull: true },
      profile_id: { type: dataTypes.INTEGER, allowNull: true },
      state_id: { type: dataTypes.STRING, allowNull: true },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
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

  SsoToken.associate = (models) => {
    models.SsoToken.belongsTo(models.Address, {
      foreignKey: 'address_id',
      targetKey: 'id',
    });
  };

  return SsoToken;
};
