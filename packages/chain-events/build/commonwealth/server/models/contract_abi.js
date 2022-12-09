"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const ContractAbi = sequelize.define('ContractAbi', {
        id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        abi: { type: dataTypes.JSONB, allowNull: false, unique: true },
        verified: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
        tableName: 'ContractAbis',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
    ContractAbi.associate = (models) => {
        models.ContractAbi.hasMany(models.Contract, { foreignKey: 'abi_id' });
    };
    return ContractAbi;
};
