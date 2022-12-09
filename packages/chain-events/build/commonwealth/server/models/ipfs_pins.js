"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const IpfsPins = sequelize.define('IpfsPins', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        address_id: { type: dataTypes.INTEGER, allowNull: false },
        ipfs_hash: { type: dataTypes.STRING, allowNull: false },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
        tableName: 'IpfsPins',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
    IpfsPins.associate = (models) => {
        models.IpfsPins.belongsTo(models.Address, { foreignKey: 'address_id', targetKey: 'id' });
    };
    return IpfsPins;
};
