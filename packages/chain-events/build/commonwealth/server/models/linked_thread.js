"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const LinkedThread = sequelize.define('LinkedThread', {
        linked_thread: {
            type: dataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        linking_thread: {
            type: dataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
        tableName: 'LinkedThreads',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
    });
    LinkedThread.associate = (models) => {
        models.LinkedThread.belongsTo(models.Thread, {
            foreignKey: 'linking_thread',
            targetKey: 'id',
        });
        models.LinkedThread.belongsTo(models.Thread, {
            foreignKey: 'linked_thread',
            targetKey: 'id',
        });
    };
    return LinkedThread;
};
