"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const ChainCategory = sequelize.define('ChainCategories', {
        id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        chain_id: {
            type: dataTypes.STRING,
            allowNull: false,
            references: { model: 'Chains', key: 'id' },
        },
        category_type_id: {
            type: dataTypes.INTEGER,
            allowNull: false,
        },
    }, {
        tableName: 'ChainCategories',
        timestamps: false,
        underscored: true,
    });
    ChainCategory.associate = (models) => {
        models.ChainCategory.belongsTo(models.Chain);
        models.ChainCategory.belongsTo(models.ChainCategoryType, {
            foreignKey: 'category_type_id',
        });
    };
    return ChainCategory;
};
