"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const Topic = sequelize.define('Topic', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: dataTypes.STRING, allowNull: false },
        description: { type: dataTypes.TEXT, allowNull: false, defaultValue: '' },
        telegram: { type: dataTypes.STRING, allowNull: true },
        chain_id: { type: dataTypes.STRING, allowNull: false },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
        deleted_at: { type: dataTypes.DATE, allowNull: true },
        token_threshold: { type: dataTypes.STRING, allowNull: true },
        featured_in_sidebar: { type: dataTypes.BOOLEAN, allowNull: true, defaultValue: false },
        featured_in_new_post: { type: dataTypes.BOOLEAN, allowNull: true, defaultValue: false },
        order: { type: dataTypes.INTEGER, allowNull: true },
        default_offchain_template: { type: dataTypes.TEXT, allowNull: false, defaultValue: '' },
        rule_id: { type: dataTypes.INTEGER, allowNull: true },
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        tableName: 'Topics',
        underscored: true,
        paranoid: true,
        defaultScope: {
            attributes: {
                exclude: ['created_at', 'updated_at', 'deleted_at'],
            }
        },
    });
    Topic.associate = (models) => {
        models.Topic.belongsTo(models.Chain, {
            as: 'chain',
            foreignKey: 'chain_id',
            targetKey: 'id',
        });
        models.Topic.hasMany(models.Thread, {
            as: 'threads',
            foreignKey: 'topic_id',
        });
        models.Topic.belongsTo(models.Rule, {
            foreignKey: 'rule_id',
        });
    };
    return Topic;
};
