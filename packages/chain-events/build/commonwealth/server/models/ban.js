"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const Ban = sequelize.define('Bans', {
        id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        address: { type: dataTypes.STRING, allowNull: false },
        chain_id: { type: dataTypes.STRING, allowNull: false },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
        tableName: 'Bans',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        timestamps: true,
        indexes: [
            { fields: ['chain_id'] },
        ]
    });
    Ban.associate = (models) => {
        models.Ban.belongsTo(models.Chain);
    };
    return Ban;
};
