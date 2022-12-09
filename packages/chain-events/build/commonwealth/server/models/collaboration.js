"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const Collaboration = sequelize.define('Collaboration', {
        address_id: { type: dataTypes.INTEGER, allowNull: false, primaryKey: true },
        thread_id: { type: dataTypes.INTEGER, allowNull: false, primaryKey: true },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
        tableName: 'Collaborations',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
    });
    Collaboration.associate = (models) => {
        models.Collaboration.belongsTo(models.Address);
        models.Collaboration.belongsTo(models.Thread);
    };
    return Collaboration;
};
