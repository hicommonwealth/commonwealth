"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const Thread = sequelize.define('Thread', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        address_id: { type: dataTypes.INTEGER, allowNull: false },
        title: { type: dataTypes.TEXT, allowNull: false },
        body: { type: dataTypes.TEXT, allowNull: true },
        plaintext: { type: dataTypes.TEXT, allowNull: true },
        kind: { type: dataTypes.TEXT, allowNull: false },
        stage: {
            type: dataTypes.TEXT,
            allowNull: false,
            defaultValue: 'discussion',
        },
        url: { type: dataTypes.TEXT, allowNull: true },
        topic_id: { type: dataTypes.INTEGER, allowNull: true },
        pinned: {
            type: dataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        chain: { type: dataTypes.STRING, allowNull: false },
        read_only: {
            type: dataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        version_history: {
            type: dataTypes.ARRAY(dataTypes.TEXT),
            defaultValue: [],
            allowNull: false,
        },
        snapshot_proposal: { type: dataTypes.STRING(48), allowNull: true },
        has_poll: { type: dataTypes.BOOLEAN, allowNull: true },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
        deleted_at: { type: dataTypes.DATE, allowNull: true },
        last_commented_on: { type: dataTypes.DATE, allowNull: true },
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        underscored: true,
        tableName: 'Threads',
        paranoid: true,
        indexes: [
            { fields: ['address_id'] },
            { fields: ['chain'] },
            { fields: ['chain', 'created_at'] },
            { fields: ['chain', 'updated_at'] },
            { fields: ['chain', 'pinned'] },
            { fields: ['chain', 'has_poll'] },
        ],
    });
    Thread.associate = (models) => {
        models.Thread.belongsTo(models.Chain, {
            foreignKey: 'chain',
            targetKey: 'id',
        });
        models.Thread.belongsTo(models.Address, {
            as: 'Address',
            foreignKey: 'address_id',
            targetKey: 'id',
        });
        models.Thread.hasMany(models.Attachment, {
            foreignKey: 'attachment_id',
            constraints: false,
            scope: { attachable: 'thread' },
        });
        models.Thread.belongsTo(models.Topic, {
            as: 'topic',
            foreignKey: 'topic_id',
        });
        models.Thread.belongsToMany(models.Address, {
            through: models.Collaboration,
            as: 'collaborators',
        });
        models.Thread.hasMany(models.Reaction, {
            foreignKey: 'thread_id',
            as: 'reactions',
        });
        models.Thread.hasMany(models.Collaboration);
        models.Thread.hasMany(models.ChainEntityMeta, {
            foreignKey: 'thread_id',
            constraints: false,
            as: 'chain_entity_meta'
        });
        models.Thread.hasMany(models.LinkedThread, {
            foreignKey: 'linked_thread',
            as: 'linking_threads',
        });
        models.Thread.hasMany(models.LinkedThread, {
            foreignKey: 'linking_thread',
            as: 'linked_threads',
        });
        models.Thread.hasMany(models.Poll, {
            foreignKey: 'thread_id',
        });
        models.Thread.hasOne(models.ChainEntityMeta, {
            foreignKey: 'id'
        });
    };
    return Thread;
};
