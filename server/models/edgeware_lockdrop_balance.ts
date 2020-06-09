import * as Sequelize from 'sequelize';

export interface EdgewareLockdropBalanceAttributes {
  id?: number;
  address: string;
  balance: string;
  blocknum: number;
}

export interface EdgewareLockdropBalanceInstance
extends Sequelize.Instance<EdgewareLockdropBalanceAttributes>, EdgewareLockdropBalanceAttributes {

}

export interface EdgewareLockdropBalanceModel extends Sequelize.Model<
  EdgewareLockdropBalanceInstance, EdgewareLockdropBalanceAttributes
> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): EdgewareLockdropBalanceModel => {
  const EdgewareLockdropBalance = sequelize.define<
    EdgewareLockdropBalanceInstance, EdgewareLockdropBalanceAttributes
  >('EdgewareLockdropBalance', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    address: { type: dataTypes.STRING, allowNull: false },
    balance: { type: dataTypes.STRING, allowNull: false },
    blocknum: { type: dataTypes.INTEGER, allowNull: false },
  }, {
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['address'] },
    ],
  });

  return EdgewareLockdropBalance;
};
