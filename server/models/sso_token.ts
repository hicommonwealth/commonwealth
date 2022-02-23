import * as Sequelize from 'sequelize';
import { DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';
import { UserAttributes } from './user';

export type SsoTokenAttributes = {
  id?: number;
  issued_at: number;
  issuer: string;
  user_id: number;
  address_id: number;
  state_id?: string;
  created_at?: Date;
  updated_at?: Date;
  User?: UserAttributes;
}

export type SsoTokenInstance = ModelInstance<SsoTokenAttributes> & {

}

export type SsoTokenModelStatic = ModelStatic<SsoTokenInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): SsoTokenModelStatic => {
  const SsoToken = <SsoTokenModelStatic>sequelize.define('SsoToken', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    issued_at: { type: dataTypes.INTEGER, allowNull: false },
    issuer: { type: dataTypes.STRING, allowNull: false },
    user_id: { type: dataTypes.INTEGER, allowNull: false },
    address_id: { type: dataTypes.INTEGER, allowNull: false },
    state_id: { type: dataTypes.STRING, allowNull: true },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
  }, {
    tableName: 'SsoTokens',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['id'] },
      { fields: ['issuer', 'user_id'] },
    ],
    defaultScope: {
      attributes: {
        exclude: [ 'issued_at', 'issuer', 'user_id', 'state_id', 'created_at', 'updated_at' ],
      }
    },
    scopes: {
      withPrivateData: {}
    }
  });

  SsoToken.associate = (models) => {
    models.SsoToken.belongsTo(models.User, { foreignKey: 'user_id', targetKey: 'id' });
    models.SsoToken.belongsTo(models.Address, { foreignKey: 'address_id', targetKey: 'id' });
  };

  return SsoToken;
};
