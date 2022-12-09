"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const Poll = sequelize.define('Poll', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        thread_id: { type: dataTypes.INTEGER, allowNull: false },
        chain_id: { type: dataTypes.STRING, allowNull: false },
        prompt: { type: dataTypes.TEXT, allowNull: false },
        options: { type: dataTypes.STRING, allowNull: true },
        ends_at: { type: dataTypes.DATE, allowNull: true },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
        tableName: 'Polls',
        indexes: [{ fields: ['thread_id'] }, { fields: ['chain_id'] }],
    });
    Poll.associate = (models) => {
        models.Poll.belongsTo(models.Thread, {
            foreignKey: 'thread_id',
            targetKey: 'id',
        });
        models.Poll.belongsTo(models.Chain, {
            foreignKey: 'chain_id',
            targetKey: 'id',
        });
        models.Poll.hasMany(models.Vote, {
            foreignKey: 'poll_id',
            as: 'votes',
        });
    };
    return Poll;
};
