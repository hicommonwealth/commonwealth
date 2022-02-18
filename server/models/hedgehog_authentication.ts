import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type HedgehogAuthenticationAttributes = {
  iv: string;
  cipherText: string;
  lookupKey: string;
  created_at?: Date;
  updated_at?: Date;
}

export type HedgehogAuthenticationInstance = ModelInstance<HedgehogAuthenticationAttributes> & {};

export type HedgehogAuthenticationModelStatic = ModelStatic<HedgehogAuthenticationInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): HedgehogAuthenticationModelStatic => {
  const HedgehogAuthentication = <HedgehogAuthenticationModelStatic>sequelize.define('HedgehogAuthentication', {
    iv:         { type: dataTypes.STRING, allowNull: false },
    cipherText: { type: dataTypes.STRING, allowNull: false },
    lookupKey:  { type: dataTypes.STRING, allowNull: false, unique: true, primaryKey: true },
  }, {
    tableName: 'HedgehogAuthentications',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return HedgehogAuthentication;
};
