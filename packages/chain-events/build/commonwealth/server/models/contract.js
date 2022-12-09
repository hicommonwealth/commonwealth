"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const Contract = sequelize.define('Contract', {
        id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        address: { type: dataTypes.STRING, allowNull: false },
        chain_node_id: { type: dataTypes.INTEGER, allowNull: false },
        decimals: { type: dataTypes.INTEGER, allowNull: true },
        token_name: { type: dataTypes.STRING, allowNull: true },
        symbol: { type: dataTypes.STRING, allowNull: true },
        type: { type: dataTypes.STRING, allowNull: false },
        abi_id: { type: dataTypes.INTEGER, allowNull: true },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
        tableName: 'Contracts',
        indexes: [{
                fields: ['address'],
            }],
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
    Contract.associate = (models) => {
        models.Contract.belongsToMany(models.Chain, { through: models.CommunityContract });
        models.Contract.belongsTo(models.ChainNode, { foreignKey: 'chain_node_id', targetKey: 'id' });
        models.Contract.belongsTo(models.ContractAbi, { foreignKey: 'abi_id', targetKey: 'id' });
    };
    return Contract;
};
