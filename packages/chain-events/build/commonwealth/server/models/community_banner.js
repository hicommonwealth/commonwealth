"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const CommunityBanner = sequelize.define('CommunityBanner', {
        id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        banner_text: { type: dataTypes.TEXT, allowNull: false },
        chain_id: { type: dataTypes.STRING, allowNull: false },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
        tableName: 'CommunityBanners',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        timestamps: true,
    });
    CommunityBanner.associate = (models) => {
        models.CommunityBanner.belongsTo(models.Chain);
    };
    return CommunityBanner;
};
