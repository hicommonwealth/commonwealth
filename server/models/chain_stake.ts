import * as Sequelize from 'sequelize';

export interface ChainStakeAttributes {
  id: number;
  author: string;
  chain: string;
  user_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ChainStakeInstance
extends Sequelize.Instance<ChainStakeAttributes>, ChainStakeAttributes { }

export interface ChainStakeModel extends Sequelize.Model<ChainStakeInstance, ChainStakeAttributes> {}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): ChainStakeModel => {
  const ChainStake = sequelize.define<ChainStakeInstance, ChainStakeAttributes>('ChainStake', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    author: { type: dataTypes.STRING, allowNull: false },
    chain: { type: dataTypes.STRING, allowNull: false },
    user_id: { type: dataTypes.INTEGER, allowNull: true },
    created_at: { type: dataTypes.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    updated_at: { type: dataTypes.DATE, allowNull: false, defaultValue: Sequelize.NOW },
  }, {
    underscored: true,
    indexes: [
      { fields: ['chain', 'author'] },
    ]
  });

  ChainStake.associate = (models) => {
    models.ChainStake.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.ChainStake.belongsTo(models.User, { foreignKey: 'user_id', targetKey: 'id' });
  };

  return ChainStake;
};
