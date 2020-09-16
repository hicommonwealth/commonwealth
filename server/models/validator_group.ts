import * as Sequelize from 'sequelize';

export interface ValidatorGroupAttributes {
  id: number;
  name: string;
  stashes: string[];
  user_id: number;
  chain: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ValidatorGroupInstance
extends Sequelize.Instance<ValidatorGroupAttributes>, ValidatorGroupAttributes { }

export interface ValidatorGroupModel extends Sequelize.Model<ValidatorGroupInstance, ValidatorGroupAttributes> {}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): ValidatorGroupModel => {
  const ValidatorGroup = sequelize.define<ValidatorGroupInstance, ValidatorGroupAttributes>('ValidatorGroup', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: dataTypes.STRING, allowNull: false },
    stashes: { type: dataTypes.ARRAY(dataTypes.STRING), allowNull: false },
    user_id: { type: dataTypes.INTEGER, allowNull: false },
    chain: { type: dataTypes.STRING, allowNull: false },
    created_at: { type: dataTypes.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    updated_at: { type: dataTypes.DATE, allowNull: false, defaultValue: Sequelize.NOW },
  }, {
    underscored: true,
    indexes: [
      { fields: ['user_id', 'name'] },
    ]
  });

  ValidatorGroup.associate = (models) => {
    models.ValidatorGroup.belongsTo(models.User, { foreignKey: 'user_id', targetKey: 'id' });
    models.ValidatorGroup.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
  };

  return ValidatorGroup;
};
