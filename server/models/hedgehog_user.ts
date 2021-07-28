import * as Sequelize from 'sequelize';
import { BuildOptions, Model, DataTypes } from 'sequelize';

export interface HedgehogUserAttributes {
  id?: number;
  username: string;
  walletAddress: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface HedgehogUserInstance extends Model<HedgehogUserAttributes>, HedgehogUserAttributes {}

type HedgehogUserModelStatic = typeof Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: BuildOptions): HedgehogUserInstance }

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
