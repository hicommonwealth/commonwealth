"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const ChainEventType = sequelize.define('ChainEventType', {
        // id = chain-event_name (event_name is value of string enum)
        id: { type: dataTypes.STRING, primaryKey: true },
        chain: { type: dataTypes.STRING, allowNull: false },
        // should never be null, but added here for migration purposes
        event_network: { type: dataTypes.STRING, allowNull: true },
        event_name: { type: dataTypes.STRING, allowNull: false },
        queued: { type: dataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
    }, {
        tableName: 'ChainEventTypes',
        timestamps: false,
        underscored: true,
        indexes: [{ fields: ['id'] }, { fields: ['chain', 'event_name'] }],
    });
    ChainEventType.associate = (models) => {
        // many emitted events of this type
        models.ChainEventType.hasMany(models.ChainEvent, { as: 'events' });
    };
    return ChainEventType;
};
