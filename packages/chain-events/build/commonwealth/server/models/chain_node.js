"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const ChainNode = sequelize.define('ChainNode', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        url: { type: dataTypes.STRING, allowNull: false },
        eth_chain_id: { type: dataTypes.INTEGER, allowNull: true },
        alt_wallet_url: { type: dataTypes.STRING, allowNull: true },
        private_url: { type: dataTypes.STRING, allowNull: true },
        balance_type: { type: dataTypes.STRING, allowNull: false },
        name: { type: dataTypes.STRING, allowNull: false },
        description: { type: dataTypes.TEXT, allowNull: true },
        ss58: { type: dataTypes.INTEGER, allowNull: true },
        bech32: { type: dataTypes.STRING, allowNull: true },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
        tableName: 'ChainNodes',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
        defaultScope: {
            attributes: {
                exclude: [
                    'private_url'
                ],
            }
        },
        scopes: {
            withPrivateData: {}
        }
    });
    ChainNode.associate = (models) => {
        models.ChainNode.hasMany(models.Chain, { foreignKey: 'chain_node_id' });
    };
    return ChainNode;
};
