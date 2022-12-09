"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const WaitlistRegistration = sequelize.define('WaitlistRegistration', {
        user_id: { type: dataTypes.INTEGER, allowNull: false },
        chain_id: { type: dataTypes.STRING, allowNull: false },
        address: { type: dataTypes.STRING, allowNull: true },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
        tableName: 'WaitlistRegistrations',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
    return WaitlistRegistration;
};
