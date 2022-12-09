"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const ChainEventType = sequelize.define('ChainEventType', {
        // id = chain-event_name (event_name is value of string enum)
        id: { type: dataTypes.STRING, primaryKey: true }
    }, {
        tableName: 'ChainEventTypes',
        timestamps: false,
        underscored: true,
        indexes: [
            { fields: ['id'] },
        ],
    });
    ChainEventType.associate = (models) => {
        models.ChainEventType.hasMany(models.Subscription, { foreignKey: 'chain_event_type_id' });
    };
    return ChainEventType;
};
