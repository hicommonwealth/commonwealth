"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const OffchainProfile = sequelize.define('OffchainProfile', {
        address_id: { type: dataTypes.INTEGER, allowNull: false, primaryKey: true },
        identity: { type: dataTypes.STRING, allowNull: true },
        judgements: { type: dataTypes.JSONB, allowNull: true },
        data: { type: dataTypes.TEXT, allowNull: true },
    }, {
        tableName: 'OffchainProfiles',
        underscored: true,
        timestamps: false,
        indexes: [
            { fields: ['address_id'] },
        ],
    });
    OffchainProfile.associate = (models) => {
        models.OffchainProfile.belongsTo(models.Address, { foreignKey: 'address_id', targetKey: 'id' });
    };
    return OffchainProfile;
};
