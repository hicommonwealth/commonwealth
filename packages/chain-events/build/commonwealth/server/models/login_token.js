"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config");
exports.default = (sequelize, dataTypes) => {
    const LoginToken = sequelize.define('LoginToken', {
        id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        token: { type: dataTypes.STRING, allowNull: false },
        email: { type: dataTypes.STRING, allowNull: true },
        expires: { type: dataTypes.DATE, allowNull: false },
        redirect_path: { type: dataTypes.STRING, allowNull: true },
        domain: { type: dataTypes.STRING, allowNull: true },
        social_account: { type: dataTypes.INTEGER, allowNull: true },
        used: { type: dataTypes.DATE, allowNull: true },
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: 'LoginTokens',
        underscored: true,
        indexes: [
            { fields: ['token', 'email'] },
        ],
    });
    LoginToken.createForEmail = async (email, path) => {
        const token = crypto_1.default.randomBytes(24).toString('hex');
        const expires = new Date(+(new Date()) + config_1.LOGIN_TOKEN_EXPIRES_IN * 60 * 1000);
        const result = await LoginToken.create({ email, expires, token, redirect_path: path });
        return result;
    };
    // This creates a LoginToken that is tied to no particular email or social account.
    // It is up to the implementer to store the ID of the generated LoginToken on a SocialAccount
    // for it to be looked up later.
    LoginToken.createForOAuth = async (domain, social_account) => {
        const token = crypto_1.default.randomBytes(24).toString('hex');
        const expires = new Date(+(new Date()) + config_1.LOGIN_TOKEN_EXPIRES_IN * 60 * 1000);
        const result = await LoginToken.create({ email: '', expires, token, domain, social_account });
        return result;
    };
    LoginToken.associate = (models) => {
        models.LoginToken.hasMany(models.SocialAccount);
    };
    return LoginToken;
};
