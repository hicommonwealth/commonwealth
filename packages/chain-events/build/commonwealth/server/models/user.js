"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const User = sequelize.define('User', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        email: { type: dataTypes.STRING },
        emailVerified: {
            type: dataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        emailNotificationInterval: {
            type: dataTypes.ENUM,
            values: ['daily', 'never'],
            defaultValue: 'never',
            allowNull: false,
        },
        isAdmin: { type: dataTypes.BOOLEAN, defaultValue: false },
        lastVisited: {
            type: dataTypes.TEXT,
            allowNull: false,
            defaultValue: '{}',
        },
        disableRichText: {
            type: dataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        selected_chain_id: { type: dataTypes.STRING, allowNull: true },
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: 'Users',
        underscored: false,
        indexes: [{ fields: ['email'], unique: true }],
        defaultScope: {
            attributes: {
                exclude: [
                    'email',
                    'emailVerified',
                    'emailNotificationInterval',
                    'isAdmin',
                    'created_at',
                    'updated_at',
                ],
            },
        },
        scopes: {
            withPrivateData: {},
        },
    });
    User.createWithProfile = async (models, attrs, options) => {
        const newUser = await User.create(attrs, options);
        const profile = await models.Profile.create({ user_id: newUser.id }, options);
        newUser.Profiles = [profile];
        return newUser;
    };
    User.associate = (models) => {
        models.User.belongsTo(models.Chain, {
            as: 'selectedChain',
            foreignKey: 'selected_chain_id',
            constraints: false,
        });
        models.User.hasMany(models.Address);
        models.User.hasMany(models.Profile);
        models.User.hasMany(models.SocialAccount);
        models.User.hasMany(models.StarredCommunity);
        models.User.belongsToMany(models.Chain, {
            through: models.WaitlistRegistration,
        });
    };
    return User;
};
