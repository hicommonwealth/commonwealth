"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const TaggedThread = sequelize.define('TaggedThread', {
        topic_id: { type: dataTypes.STRING, allowNull: false },
        thread_id: { type: dataTypes.INTEGER, allowNull: false },
    }, {
        tableName: 'TaggedThreads',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
    return TaggedThread;
};
