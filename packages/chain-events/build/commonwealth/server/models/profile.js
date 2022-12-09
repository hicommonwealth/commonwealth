"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const Profile = sequelize.define('Profile', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
        user_id: { type: dataTypes.INTEGER, allowNull: false },
        created_at: { type: dataTypes.DATE, allowNull: true },
        updated_at: { type: dataTypes.DATE, allowNull: true },
        profile_name: { type: dataTypes.STRING, allowNull: true },
        email: { type: dataTypes.STRING, allowNull: true },
        website: { type: dataTypes.STRING, allowNull: true },
        bio: { type: dataTypes.TEXT, allowNull: true },
        is_default: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        avatar_url: { type: dataTypes.STRING, allowNull: true },
        slug: { type: dataTypes.STRING, allowNull: true },
    }, {
        tableName: 'Profiles',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['user_id'] },
        ],
    });
    Profile.associate = (models) => {
        models.Profile.belongsTo(models.User, { foreignKey: 'user_id', targetKey: 'id' });
        models.Profile.hasMany(models.Address, { foreignKey: 'profile_id' });
    };
    return Profile;
};
