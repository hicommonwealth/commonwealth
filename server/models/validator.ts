import * as Sequelize from 'sequelize';

export interface ValidatorAttributes {
    stash: string;
    controller: string;
    sessionKeys: string[];
    state: string;
    name: string;
    lastUpdate: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface ValidatorInstance extends Sequelize.Instance<ValidatorAttributes>, ValidatorAttributes {

}

export interface ValidatorModel extends Sequelize.Model<ValidatorInstance, ValidatorAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): ValidatorModel => {
  const Validators = sequelize.define<ValidatorInstance, ValidatorAttributes>('Validator', {
    stash: { type: dataTypes.STRING, allowNull: false, primaryKey: true }, // AccountID
    name: { type: dataTypes.STRING }, // AccountId
    controller: { type: dataTypes.STRING, allowNull: false }, // AccountId
    sessionKeys: { type: dataTypes.ARRAY(dataTypes.STRING), allowNull: false }, // AccountID[]
    state: { type: dataTypes.STRING, allowNull: false }, // Active/waiting/inactive
    lastUpdate: { type: dataTypes.BIGINT, allowNull: false }, // blocknumber,
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false }
  }, {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  });

  Validators.associate = (models) => {
    models.Validator.hasMany(models.HistoricalValidatorStatistic, { foreignKey: 'stash' });
  };
  return Validators;
};
