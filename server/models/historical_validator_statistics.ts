import * as Sequelize from 'sequelize';
import { Validators } from '../../client/scripts/views/pages/validators/index';

export interface HistoricalValidatorStatisticsAttributes {
    id: number,
    stash: string;
    block: string;
    exposure: string[];
    commissionPer?: number;
    apr?: number;
    uptime?: string;
    movingAverages?: number;
    hasMessage: boolean;
    isOnline: boolean,
    eraPoints: number,
    isElected: boolean,
    toBeElected: boolean,
    blockCount: number,
    otherTotal: string,
    name: string,
    created_at?: Date;
    updated_at?: Date;
}

export interface HistoricalValidatorStatisticsInstance extends Sequelize.Instance<HistoricalValidatorStatisticsAttributes>, HistoricalValidatorStatisticsAttributes {

}

export interface HistoricalValidatorStatisticsModel extends Sequelize.Model<HistoricalValidatorStatisticsInstance, HistoricalValidatorStatisticsAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): HistoricalValidatorStatisticsModel => {
  const HistoricalValidatorStatistics = sequelize.define<HistoricalValidatorStatisticsInstance, HistoricalValidatorStatisticsAttributes>('HistoricalValidatorStatistic', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true }, // primary-key
    stash: { type: dataTypes.STRING, allowNull: false },
    name: { type: dataTypes.STRING, allowNull: true },
    block: { type: dataTypes.STRING, allowNull: false }, // blocknumber
    exposure: { type: dataTypes.JSON, allowNull: false },
    commissionPer: { type: dataTypes.FLOAT, allowNull: false },
    apr: { type: dataTypes.FLOAT, allowNull: false },
    uptime: { type: dataTypes.STRING, allowNull: false },
    movingAverages: { type: dataTypes.INTEGER, allowNull: false },
    hasMessage: { type: dataTypes.BOOLEAN, allowNull: false },
    isOnline: { type: dataTypes.BOOLEAN, allowNull: false },
    eraPoints: { type: dataTypes.INTEGER, allowNull: false },
    isElected: { type: dataTypes.BOOLEAN, allowNull: false },
    toBeElected: { type: dataTypes.BOOLEAN, allowNull: false },
    blockCount: { type: dataTypes.INTEGER, allowNull: false },
    otherTotal: { type: dataTypes.STRING, allowNull: false },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
  }, {
    timestamps: true,
    underscored: true
  });
  HistoricalValidatorStatistics.associate = (models) => {
    models.HistoricalValidatorStatistics.belongsTo(models.Validator, { foreignKey: 'stash' });
  };
  return HistoricalValidatorStatistics;
};
