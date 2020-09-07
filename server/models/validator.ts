import { getCurrentTimestamp } from './../../client/scripts/views/stats/stats_helpers';
import * as Sequelize from 'sequelize';

export interface ValidatorAttributes {
    stash_id: string;
    controller: string;
    sessionKeys: string[];
    state: string;
    name: string;
    lastUpdate: string;
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
        stash_id: { type: dataTypes.STRING, allowNull: false, primaryKey: true },//AccountID
        name: { type: dataTypes.STRING }, // AccountId
        controller: { type: dataTypes.STRING, allowNull: false }, // AccountId
        sessionKeys: { type: dataTypes.ARRAY(dataTypes.STRING), allowNull: false }, //AccountID[]
        state: { type: dataTypes.STRING, allowNull: false }, //Active/waiting/inactive
        lastUpdate: { type: dataTypes.BIGINT, allowNull: false },//blocknumber,

    });

    Validators.associate = models => {
        models.Validators.hasMany(models.HistoricalValidatorStats, { foreignKey: 'stash_id' });
    }
    return Validators;
};
