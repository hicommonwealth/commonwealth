import * as Sequelize from 'sequelize';
import { BuildOptions, Model, DataTypes } from 'sequelize';

export interface EdgewareLockdropBalanceAttributes {
  id?: number;
  address: string;
  balance: string;
  blocknum: number;
}

export interface EdgewareLockdropBalanceInstance
extends Model<EdgewareLockdropBalanceAttributes>, EdgewareLockdropBalanceAttributes {}


type EdgewareLockdropBalanceModelStatic = typeof Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: BuildOptions): EdgewareLockdropBalanceInstance }

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
