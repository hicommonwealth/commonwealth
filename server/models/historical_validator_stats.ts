import * as Sequelize from 'sequelize';

export interface HistoricalValidatorStatsAttributes {
    id: number,
    stash_id: string;
    block: string;
    exposure: string[];
    commission?: string;
    preferences?: number;
    apr?: string;
    uptime?: string;
    movingAverages?: number;
    isLatest: boolean;
    hasMessage: boolean;
    isOnline: boolean;
    eraPoints: number;
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
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true }, //primary-key
        stash_id: { type: dataTypes.STRING, allowNull: false },
        block: { type: dataTypes.STRING, allowNull: false }, // blocknumber
        exposure: { type: dataTypes.ARRAY(dataTypes.STRING), allowNull: false },
        commission: { type: dataTypes.STRING, allowNull: false },
        preferences: { type: dataTypes.INTEGER, allowNull: false },// preferences - ValidatorPrefs
        apr: { type: dataTypes.STRING, allowNull: false },
        uptime: { type: dataTypes.STRING, allowNull: false },
        movingAverages: { type: dataTypes.INTEGER, allowNull: false },
        isLatest: { type: dataTypes.BOOLEAN, allowNull: false },
        hasMessage: { type: dataTypes.BOOLEAN, allowNull: false },
        isOnline: { type: dataTypes.BOOLEAN, allowNull: false },
        eraPoints: { type: dataTypes.INTEGER, allowNull: false }
    });

    HistoricalValidatorStats.associate = (models) => {
        models.HistoricalValidatorStats.belongsTo(models.Validators, { foreignKey: 'stash_id' });

    };
    return HistoricalValidatorStats;
};
