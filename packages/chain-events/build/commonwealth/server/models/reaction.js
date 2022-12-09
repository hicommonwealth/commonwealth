"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const Reaction = sequelize.define('Reaction', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        chain: { type: dataTypes.STRING, allowNull: false },
        thread_id: { type: dataTypes.INTEGER, allowNull: true },
        proposal_id: { type: dataTypes.STRING, allowNull: true },
        comment_id: { type: dataTypes.INTEGER, allowNull: true },
        address_id: { type: dataTypes.INTEGER, allowNull: false },
        reaction: { type: dataTypes.STRING, allowNull: false },
    }, {
        tableName: 'Reactions',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['id'] },
            { fields: ['chain', 'thread_id', 'proposal_id', 'comment_id'] },
            { fields: ['address_id'] },
            { fields: ['chain', 'address_id', 'thread_id', 'proposal_id', 'comment_id', 'reaction'], unique: true },
            { fields: ['chain', 'thread_id'] },
            { fields: ['chain', 'comment_id'] },
        ],
    });
    Reaction.associate = (models) => {
        models.Reaction.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
        models.Reaction.belongsTo(models.Address, { foreignKey: 'address_id', targetKey: 'id' });
        models.Reaction.belongsTo(models.Comment, { foreignKey: 'comment_id', targetKey: 'id' });
        models.Reaction.belongsTo(models.Thread, { foreignKey: 'thread_id', targetKey: 'id' });
    };
    return Reaction;
};
