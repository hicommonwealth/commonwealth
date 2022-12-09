"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Sequelize = __importStar(require("sequelize"));
exports.default = (sequelize, dataTypes) => {
    const ChatChannel = sequelize.define('ChatChannel', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: Sequelize.STRING(255),
            allowNull: false,
        },
        chain_id: {
            type: Sequelize.STRING,
            allowNull: false,
            onDelete: 'CASCADE',
            references: {
                model: 'Chains',
                key: 'id',
            },
        },
        category: {
            type: Sequelize.STRING(255),
            allowNull: false
        },
        rule_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        created_at: {
            type: Sequelize.DATE,
            allowNull: false,
        },
        updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
        },
    }, {
        tableName: 'ChatChannels',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        timestamps: true,
    });
    ChatChannel.associate = (models) => {
        models.ChatChannel.hasMany(models.ChatMessage, {
            foreignKey: 'chat_channel_id',
        });
        models.ChatChannel.belongsTo(models.Chain, {
            onDelete: 'CASCADE'
        });
        models.ChatChannel.belongsTo(models.Rule, {
            foreignKey: 'rule_id',
        });
    };
    return ChatChannel;
};
