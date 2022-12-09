"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const ChainEvent = sequelize.define('ChainEvent', {
        id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        chain_event_type_id: { type: dataTypes.STRING, allowNull: false },
        block_number: { type: dataTypes.INTEGER, allowNull: false },
        entity_id: { type: dataTypes.INTEGER, allowNull: true },
        event_data: { type: dataTypes.JSONB, allowNull: false },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
        queued: { type: dataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
    }, {
        tableName: 'ChainEvents',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
        paranoid: false,
        indexes: [
            { fields: ['id'] },
            { fields: ['block_number', 'chain_event_type_id'] },
        ],
    });
    ChainEvent.associate = (models) => {
        // master event type
        models.ChainEvent.belongsTo(models.ChainEventType, {
            foreignKey: 'chain_event_type_id',
            targetKey: 'id',
        });
        models.ChainEvent.belongsTo(models.ChainEntity, {
            foreignKey: 'entity_id',
            targetKey: 'id',
        });
    };
    return ChainEvent;
};
