"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const ChainEntity = sequelize.define('ChainEntity', {
        id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        chain: { type: dataTypes.STRING, allowNull: false },
        type: { type: dataTypes.STRING, allowNull: false },
        type_id: { type: dataTypes.STRING, allowNull: false },
        completed: {
            type: dataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        author: { type: dataTypes.STRING, allowNull: true },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
        queued: { type: dataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
    }, {
        tableName: 'ChainEntities',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
        paranoid: false,
        indexes: [
            { fields: ['id'] },
            { fields: ['thread_id'] },
            { fields: ['chain', 'type', 'id'], unique: true },
        ],
    });
    ChainEntity.associate = (models) => {
        models.ChainEntity.hasMany(models.ChainEvent, { foreignKey: 'entity_id' });
    };
    return ChainEntity;
};
