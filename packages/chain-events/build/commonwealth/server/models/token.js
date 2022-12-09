"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const Token = sequelize.define('Token', {
        id: { type: dataTypes.STRING, allowNull: false, primaryKey: true },
        decimals: { type: dataTypes.INTEGER, allowNull: false },
        name: { type: dataTypes.STRING, allowNull: false },
        address: { type: dataTypes.STRING, allowNull: false },
        symbol: { type: dataTypes.STRING, allowNull: false },
        chain_id: { type: dataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        icon_url: { type: dataTypes.STRING(1024), allowNull: true },
    }, {
        tableName: 'Tokens',
        timestamps: false,
        underscored: true,
        // TODO: indexes
    });
    return Token;
};
