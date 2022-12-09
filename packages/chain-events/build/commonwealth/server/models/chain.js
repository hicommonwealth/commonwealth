"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const Chain = sequelize.define('Chain', {
        id: { type: dataTypes.STRING, primaryKey: true },
        chain_node_id: { type: dataTypes.INTEGER, allowNull: true },
        name: { type: dataTypes.STRING, allowNull: false },
        description: { type: dataTypes.STRING, allowNull: true },
        token_name: { type: dataTypes.STRING, allowNull: true },
        website: { type: dataTypes.STRING, allowNull: true },
        discord: { type: dataTypes.STRING, allowNull: true },
        element: { type: dataTypes.STRING, allowNull: true },
        telegram: { type: dataTypes.STRING, allowNull: true },
        github: { type: dataTypes.STRING, allowNull: true },
        default_symbol: { type: dataTypes.STRING, allowNull: false },
        network: { type: dataTypes.STRING, allowNull: false },
        base: { type: dataTypes.STRING, allowNull: false, defaultValue: '' },
        ss58_prefix: { type: dataTypes.INTEGER, allowNull: true },
        icon_url: { type: dataTypes.STRING },
        active: { type: dataTypes.BOOLEAN },
        stages_enabled: {
            type: dataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true,
        },
        custom_stages: { type: dataTypes.STRING, allowNull: true },
        custom_domain: { type: dataTypes.STRING, allowNull: true },
        block_explorer_ids: { type: dataTypes.STRING, allowNull: true },
        collapsed_on_homepage: {
            type: dataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        type: { type: dataTypes.STRING, allowNull: false },
        substrate_spec: { type: dataTypes.JSONB, allowNull: true },
        has_chain_events_listener: {
            type: dataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        default_summary_view: { type: dataTypes.BOOLEAN, allowNull: true },
        snapshot: {
            type: dataTypes.ARRAY(dataTypes.STRING),
            allowNull: true,
        },
        terms: { type: dataTypes.STRING, allowNull: true },
        bech32_prefix: { type: dataTypes.STRING, allowNull: true },
        admin_only_polling: { type: dataTypes.BOOLEAN, allowNull: true },
        default_allow_permissions: {
            type: dataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
        },
        default_deny_permissions: {
            type: dataTypes.BIGINT,
            allowNull: false,
            defaultValue: 0,
        },
    }, {
        tableName: 'Chains',
        timestamps: false,
        underscored: false,
    });
    Chain.associate = (models) => {
        models.Chain.belongsTo(models.ChainNode, { foreignKey: 'chain_node_id' });
        models.Chain.hasMany(models.Address, { foreignKey: 'chain' });
        models.Chain.hasMany(models.Notification, { foreignKey: 'chain_id' });
        models.Chain.hasMany(models.Topic, {
            as: 'topics',
            foreignKey: 'chain_id',
        });
        models.Chain.hasMany(models.Thread, { foreignKey: 'chain' });
        models.Chain.hasMany(models.Comment, { foreignKey: 'chain' });
        models.Chain.hasMany(models.StarredCommunity, { foreignKey: 'chain' });
        models.Chain.hasMany(models.ChatChannel);
        models.Chain.belongsToMany(models.User, {
            through: models.WaitlistRegistration,
        });
        models.Chain.belongsToMany(models.Contract, {
            through: models.CommunityContract,
        });
        models.Chain.hasMany(models.ChainEntityMeta, { foreignKey: 'chain' });
    };
    return Chain;
};
