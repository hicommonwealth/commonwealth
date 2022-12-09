"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const IdentityCache = sequelize.define('IdentityCache', {
        chain: { type: dataTypes.STRING, allowNull: false },
        address: { type: dataTypes.STRING, allowNull: false }
    }, { timestamps: false });
    // we don't define a primary key so sequelize assumes a primary key on column "id" so this removes that assumption
    IdentityCache.removeAttribute('id');
    IdentityCache.associate = (models) => {
        models.IdentityCache.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    };
    return IdentityCache;
};
