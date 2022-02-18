import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type HedgehogUserAttributes = {
  username: string;
  walletAddress: string;
  id?: number;
  created_at?: Date;
  updated_at?: Date;
}

export type HedgehogUserInstance = ModelInstance<HedgehogUserAttributes>;

export type HedgehogUserModelStatic = ModelStatic<HedgehogUserInstance>;

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
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
  });

  return HedgehogUser;
};
