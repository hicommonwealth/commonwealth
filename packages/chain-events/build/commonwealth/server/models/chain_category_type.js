"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const ChainCategoryType = sequelize.define('ChainCategoryType', {
        id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        category_name: { type: dataTypes.STRING, allowNull: true },
    }, {
        tableName: 'ChainCategoryTypes',
        timestamps: false,
        underscored: true,
    });
    return ChainCategoryType;
};
