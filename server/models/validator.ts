import * as Sequelize from 'sequelize';

export interface ValidatorAttributes {
    stash?: string;
    controller: string;
    sessionKeys: string[];
    state?: string;
    lastUpdate?: string;
}

export interface ValidatorInstance extends Sequelize.Instance<ValidatorAttributes>, ValidatorAttributes {

}

export interface ValidatorModel extends Sequelize.Model<ValidatorInstance, ValidatorAttributes> {

}

export default (
    sequelize: Sequelize.Sequelize,
    dataTypes: Sequelize.DataTypes,
): ValidatorModel => {
    const Validator = sequelize.define<ValidatorInstance, ValidatorAttributes>('Validator', {
        stash: { type: dataTypes.STRING, allowNull: false }, //AccountID
        controller: { type: dataTypes.STRING, allowNull: false }, // AccountId
        sessionKeys: { type: dataTypes.ARRAY(dataTypes.STRING), allowNull: false }, //AccountID[]
        state: { type: dataTypes.STRING, allowNull: false }, //Active/waiting/inactive
        lastUpdate: { type: dataTypes.INTEGER, allowNull: false } //blocknumber
    })
    return Validator;
};
