import * as Sequelize from 'sequelize';
import { BuildOptions, Model, DataTypes } from 'sequelize';
import { ModelStatic } from '../../shared/types';

export interface HedgehogAuthenticationAttributes {
  iv: string;
  cipherText: string;
  lookupKey: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface HedgehogAuthenticationInstance
extends Model<HedgehogAuthenticationAttributes>, HedgehogAuthenticationAttributes {}

type HedgehogAuthenticationModelStatic = ModelStatic<HedgehogAuthenticationInstance>

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
  });

  return HedgehogAuthentication;
};
