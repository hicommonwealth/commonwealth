"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const Rule = sequelize.define('Rule', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        chain_id: { type: dataTypes.STRING, allowNull: false },
        rule: { type: dataTypes.JSONB, allowNull: false },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: 'Rules',
        underscored: true,
        indexes: [
            { fields: ['chain_id'] },
        ],
    });
    Rule.associate = (models) => {
        models.Rule.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
    };
    return Rule;
};
