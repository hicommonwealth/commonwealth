"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const ChainEntityMeta = sequelize.define('ChainEntityMeta', {
        id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        ce_id: { type: dataTypes.INTEGER, allowNull: false, unique: true },
        title: { type: dataTypes.STRING, allowNull: true },
        chain: { type: dataTypes.STRING, allowNull: false },
        author: { type: dataTypes.STRING, allowNull: true },
        thread_id: { type: dataTypes.INTEGER, allowNull: true }
    }, {
        tableName: 'ChainEntityMeta',
        timestamps: false,
        underscored: true,
        paranoid: false,
        indexes: [
            { fields: ['id'] },
        ],
    });
    ChainEntityMeta.associate = (models) => {
        models.ChainEntityMeta.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
        models.ChainEntityMeta.belongsTo(models.Thread, { foreignKey: 'thread_id', targetKey: 'id' });
    };
    return ChainEntityMeta;
};
