import { getCurrentTimestamp } from './../../client/scripts/views/stats/stats_helpers';
import * as Sequelize from 'sequelize';

export interface ValidatorAttributes {
    stash: string;
    controller: string;
    sessionKeys: string[];
    state: string;
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

        stash: { type: dataTypes.STRING, allowNull: false, primaryKey: true },//AccountID
        controller: { type: dataTypes.STRING, allowNull: false }, // AccountId
        sessionKeys: { type: dataTypes.ARRAY(dataTypes.STRING), allowNull: false }, //AccountID[]
        state: { type: dataTypes.STRING, allowNull: false }, //Active/waiting/inactive
        lastUpdate: { type: dataTypes.BIGINT, allowNull: false },//blocknumber,
    })
    return Validators;
};
