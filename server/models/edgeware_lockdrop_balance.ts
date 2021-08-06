import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';

export interface EdgewareLockdropBalanceAttributes {
  address: string;
  balance: string;
  blocknum: number;
  id?: number;
}

export interface EdgewareLockdropBalanceInstance
extends Model<EdgewareLockdropBalanceAttributes>, EdgewareLockdropBalanceAttributes {}

export type EdgewareLockdropBalanceModelStatic = ModelStatic<EdgewareLockdropBalanceInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): EdgewareLockdropBalanceModelStatic => {
  const EdgewareLockdropBalance = <EdgewareLockdropBalanceModelStatic>sequelize.define('EdgewareLockdropBalance', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    address: { type: dataTypes.STRING, allowNull: false },
    balance: { type: dataTypes.STRING, allowNull: false },
    blocknum: { type: dataTypes.INTEGER, allowNull: false },
  }, {
    tableName: 'EdgewareLockdropBalances',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['address'] },
    ],
  });

  return EdgewareLockdropBalance;
};
