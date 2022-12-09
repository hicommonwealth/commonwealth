"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const ViewCount = sequelize.define('ViewCount', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        chain: { type: dataTypes.STRING, allowNull: false },
        object_id: { type: dataTypes.INTEGER, allowNull: false },
        view_count: { type: dataTypes.INTEGER, allowNull: false },
    }, {
        tableName: 'ViewCounts',
        underscored: true,
        timestamps: false,
        indexes: [
            { fields: ['id'] },
            { fields: ['chain', 'object_id'] },
            { fields: ['view_count'] },
        ],
    });
    ViewCount.associate = (models) => {
        models.ViewCount.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
        models.ViewCount.belongsTo(models.Thread, { foreignKey: 'object_id', targetKey: 'id' });
    };
    return ViewCount;
};
