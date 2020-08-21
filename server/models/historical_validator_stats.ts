import * as Sequelize from 'sequelize';

export interface HistoricalValidatorStatsAttributes {
    stash_id?: string;
    block: string;
    exposure: string[];
    commission?: string;
    preferences?: number;
    apr?: string;
    uptime?: string;
    movingAverages?: number;
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
        stash_id: { type: dataTypes.STRING, allowNull: false }, //AccountID
        block: { type: dataTypes.STRING, allowNull: false }, // blocknumber
        exposure: { type: dataTypes.ARRAY(dataTypes.STRING), allowNull: false },
        commission: { type: dataTypes.STRING, allowNull: false },
        preferences: { type: dataTypes.INTEGER, allowNull: false },// preferences - ValidatorPrefs
        apr: { type: dataTypes.STRING, allowNull: false },
        uptime: { type: dataTypes.STRING, allowNull: false },
        movingAverages: { type: dataTypes.INTEGER, allowNull: false }
    })

    HistoricalValidatorStats.associate = (models) => {
        models.HistoricalValidatorStats.belongsTo(models.Validator, {
            foreignKey: 'stash_id',
            targetKey: 'stash'
        });
    };
    return HistoricalValidatorStats;
};
