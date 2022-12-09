"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const Webhook = sequelize.define('Webhook', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        url: { type: dataTypes.STRING, allowNull: false },
        chain_id: { type: dataTypes.STRING, allowNull: false },
        categories: { type: dataTypes.ARRAY(dataTypes.STRING), allowNull: false, defaultValue: [] },
    }, {
        tableName: 'Webhooks',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['url'] },
            { fields: ['chain_id'] },
        ],
    });
    Webhook.associate = (models) => {
        models.Webhook.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
    };
    return Webhook;
};
