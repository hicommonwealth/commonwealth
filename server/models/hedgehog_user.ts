import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';

export interface HedgehogUserAttributes {
  username: string;
  walletAddress: string;
  id?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface HedgehogUserInstance extends Model<HedgehogUserAttributes>, HedgehogUserAttributes {}

export type HedgehogUserModelStatic = ModelStatic<HedgehogUserInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): HedgehogUserModelStatic => {
  const HedgehogUser = <HedgehogUserModelStatic>sequelize.define('HedgehogUser', {
    id:            { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    username:      { type: dataTypes.STRING, allowNull: false, unique: true },
    walletAddress: { type: dataTypes.STRING, allowNull: true },
  }, {
    tableName: 'HedgehogUsers',
    underscored: true,
  });

  return HedgehogUser;
};
