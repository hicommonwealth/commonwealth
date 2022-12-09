"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const CommunityContract = sequelize.define('CommunityContract', {
        id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        chain_id: { type: dataTypes.STRING, allowNull: false },
        contract_id: { type: dataTypes.INTEGER, allowNull: false },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
        tableName: 'CommunityContracts',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['chain_id'], unique: true },
        ],
    });
    CommunityContract.associate = (models) => {
        models.CommunityContract.belongsTo(models.Contract, { foreignKey: 'contract_id', targetKey: 'id' });
        models.CommunityContract.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
    };
    return CommunityContract;
};
