import * as Sequelize from 'sequelize';

export interface ValidatorAttributes {
  stash_id: string;
  controller: string;
  sessionKeys: string[];
  state: string;
  preferences: string;
  name: string;
  lastUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidatorInstance extends Sequelize.Instance<ValidatorAttributes>, ValidatorAttributes {

}

export interface ValidatorModel extends Sequelize.Model<ValidatorInstance, ValidatorAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): ValidatorModel => {
  const Validators = sequelize.define<ValidatorInstance, ValidatorAttributes>('Validators', {
    stash_id: { type: dataTypes.STRING, allowNull: false, primaryKey: true },
    name: { type: dataTypes.STRING },
    controller: { type: dataTypes.STRING, allowNull: false },
    sessionKeys: { type: dataTypes.ARRAY(dataTypes.STRING), allowNull: false },
    state: {
      type: dataTypes.ENUM,
      values: ['active', 'waiting', 'inactive'],
      defaultValue: 'inactive',
      allowNull: false,
    },
    preferences: {
      type: dataTypes.ENUM,
      values: ['stash-staked', 'stash-unstaked', 'controller'],
      defaultValue: 'stash-staked',
      allowNull: false,
    },
    lastUpdate: { type: dataTypes.DATE, allowNull: false },
    createdAt: { type: dataTypes.DATE },
    updatedAt: { type: dataTypes.DATE },
  });

  Validators.associate = (models) => {
    models.Validators.hasMany(models.HistoricalValidatorStats, { foreignKey: 'stash_id' });
  };

  return Validators;
};
