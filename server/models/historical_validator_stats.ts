/* eslint-disable max-len */
import * as Sequelize from 'sequelize';

export interface HistoricalValidatorStatsAttributes {
  id: number,
  stash_id: string;
  blockNumber: Number;
  exposure: string[];
  commissionPer?: number;
  apr?: number;
  uptime?: string;
  eraPoints: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoricalValidatorStatsInstance extends Sequelize.Instance<HistoricalValidatorStatsAttributes>, HistoricalValidatorStatsAttributes {

}

export interface HistoricalValidatorStatsModel extends Sequelize.Model<HistoricalValidatorStatsInstance, HistoricalValidatorStatsAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): HistoricalValidatorStatsModel => {
  const HistoricalValidatorStats = sequelize.define<HistoricalValidatorStatsInstance, HistoricalValidatorStatsAttributes>('HistoricalValidatorStats', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    stash_id: { type: dataTypes.STRING, allowNull: false, references: { model: 'Validators', key: 'stash' } },
    name: { type: dataTypes.STRING },
    blockNumber: { type: dataTypes.STRING, allowNull: false },
    exposure: { type: dataTypes.JSON, allowNull: false },
    commissionPer: { type: dataTypes.FLOAT, allowNull: false },
    apr: { type: dataTypes.FLOAT, allowNull: false },
    uptime: { type: dataTypes.STRING, allowNull: false },
    eraPoints: { type: dataTypes.INTEGER, allowNull: false },
    createdAt: { type: dataTypes.DATE },
    updatedAt: { type: dataTypes.DATE },
  });
  HistoricalValidatorStats.associate = (models) => {
    models.HistoricalValidatorStats.belongsTo(models.Validators, { foreignKey: 'stash_id' });
  };
  return HistoricalValidatorStats;
};
