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
    const Vote = sequelize.define('Vote', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        poll_id: { type: dataTypes.INTEGER, allowNull: false },
        option: { type: dataTypes.STRING, allowNull: false },
        address: { type: Sequelize.STRING, allowNull: false },
        author_chain: { type: Sequelize.STRING, allowNull: true },
        chain_id: { type: Sequelize.STRING, allowNull: true },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
        tableName: 'Votes',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [{ fields: ['poll_id'] }],
    });
    Vote.associate = (models) => {
        models.Vote.belongsTo(models.Poll, {
            foreignKey: 'poll_id',
            constraints: false,
            as: 'poll',
        });
    };
    return Vote;
};
