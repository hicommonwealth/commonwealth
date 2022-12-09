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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importStar(require("sequelize"));
const types_1 = require("../../../common-common/src/types");
const logging_1 = require("../../../common-common/src/logging");
const webhookNotifier_1 = __importDefault(require("../webhookNotifier"));
const config_1 = require("../config");
const emails_1 = require("../scripts/emails");
const statsd_1 = require("../../../common-common/src/statsd");
const log = logging_1.factory.getLogger((0, logging_1.formatFilename)(__filename));
const { Op } = sequelize_1.default;
exports.default = (sequelize, dataTypes) => {
    const Subscription = sequelize.define('Subscription', {
        id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        subscriber_id: { type: dataTypes.INTEGER, allowNull: false },
        category_id: { type: dataTypes.STRING, allowNull: false },
        object_id: { type: dataTypes.STRING, allowNull: false },
        is_active: { type: dataTypes.BOOLEAN, defaultValue: true, allowNull: false },
        immediate_email: { type: dataTypes.BOOLEAN, defaultValue: false, allowNull: false },
        // TODO: change allowNull to false once subscription refactor is implemented
        chain_id: { type: dataTypes.STRING, allowNull: true },
        offchain_thread_id: { type: dataTypes.INTEGER, allowNull: true },
        offchain_comment_id: { type: dataTypes.INTEGER, allowNull: true },
        chain_event_type_id: { type: dataTypes.STRING, allowNull: true },
        chain_entity_id: { type: dataTypes.INTEGER, allowNull: true },
    }, {
        tableName: 'Subscriptions',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['subscriber_id'] },
            { fields: ['category_id', 'object_id', 'is_active'] },
            { fields: ['offchain_thread_id'] },
        ],
    });
    Subscription.emitNotifications = async (models, category_id, object_id, notification_data, webhook_data, excludeAddresses, includeAddresses) => {
        // get subscribers to send notifications to
        statsd_1.StatsDController.get().increment('cw.notifications.created', {
            category_id,
            object_id,
            chain: notification_data.chain || notification_data.chain_id,
        });
        const findOptions = {
            [Op.and]: [
                { category_id },
                { object_id },
                { is_active: true },
            ],
        };
        // typeguard function to differentiate between chain event notifications as needed
        const isChainEventData = notification_data.chainEvent !== undefined;
        // retrieve distinct user ids given a set of addresses
        const fetchUsersFromAddresses = async (addresses) => {
            // fetch user ids from address models
            const addressModels = await models.Address.findAll({
                where: {
                    address: {
                        [Op.in]: addresses,
                    },
                },
            });
            if (addressModels && addressModels.length > 0) {
                const userIds = addressModels.map((a) => a.user_id);
                // remove duplicates
                const userIdsDedup = userIds.filter((a, b) => userIds.indexOf(a) === b);
                return userIdsDedup;
            }
            else {
                return [];
            }
        };
        // currently excludes override includes, but we may want to provide the option for both
        if (excludeAddresses && excludeAddresses.length > 0) {
            const ids = await fetchUsersFromAddresses(excludeAddresses);
            if (ids && ids.length > 0) {
                findOptions[Op.and].push({ subscriber_id: { [Op.notIn]: ids } });
            }
        }
        else if (includeAddresses && includeAddresses.length > 0) {
            const ids = await fetchUsersFromAddresses(includeAddresses);
            if (ids && ids.length > 0) {
                findOptions[Op.and].push({ subscriber_id: { [Op.in]: ids } });
            }
        }
        // get all relevant subscriptions
        const subscriptions = await models.Subscription.findAll({
            where: findOptions,
            include: models.User,
        });
        // get notification if it already exists
        let notification;
        notification = await models.Notification.findOne(isChainEventData ? {
            where: {
                chain_event_id: notification_data.chainEvent.id
            }
        } : {
            where: {
                notification_data: JSON.stringify(notification_data)
            }
        });
        // if the notification does not yet exist create it here
        if (!notification) {
            if (isChainEventData) {
                const event = notification_data.chainEvent;
                event.ChainEventType = notification_data.chainEventType;
                notification = await models.Notification.create({
                    notification_data: JSON.stringify(event),
                    chain_event_id: notification_data.chainEvent.id,
                    category_id: 'chain-event',
                    chain_id: notification_data.chain_id
                });
            }
            else {
                notification = await models.Notification.create({
                    notification_data: JSON.stringify(notification_data),
                    category_id,
                    chain_id: notification_data.chain_id
                        || notification_data.chain
                        || notification_data.chain_id
                });
            }
        }
        let msg;
        try {
            msg = await (0, emails_1.createImmediateNotificationEmailObject)(notification_data, category_id, models);
        }
        catch (e) {
            console.log('Error generating immediate notification email!');
            console.trace(e);
        }
        // create NotificationsRead instances
        // await models.NotificationsRead.bulkCreate(subscribers.map((subscription) => ({
        //   subscription_id: subscription.id,
        //   notification_id: notification.id,
        //   is_read: false,
        //   user_id: subscription.subscriber_id
        // })));
        let query = `INSERT INTO "NotificationsRead" VALUES `;
        const replacements = [];
        for (const subscription of subscriptions) {
            if (subscription.subscriber_id) {
                statsd_1.StatsDController.get().increment('cw.notifications.emitted', {
                    category_id,
                    object_id,
                    chain: notification_data.chain || notification_data.chain_id,
                    subscriber: `${subscription.subscriber_id}`,
                });
                query += `(?, ?, ?, ?, (SELECT COALESCE(MAX(id), 0) + 1 FROM "NotificationsRead" WHERE user_id = ?)), `;
                replacements.push(notification.id, subscription.id, false, subscription.subscriber_id, subscription.subscriber_id);
            }
            else {
                // TODO: rollbar reported issue originates from here
                log.info(`Subscription: ${JSON.stringify(subscription.toJSON())}\nNotification_data: ${JSON.stringify(notification_data)}`);
            }
        }
        if (replacements.length > 0) {
            query = query.slice(0, -2) + ';';
            await models.sequelize.query(query, { replacements, type: sequelize_1.QueryTypes.INSERT });
        }
        // send emails
        for (const subscription of subscriptions) {
            if (msg && isChainEventData && notification_data.chainEventType?.chain) {
                msg.dynamic_template_data.notification.path = `${config_1.SERVER_URL}/${notification_data.chainEventType.chain}/notifications?id=${notification.id}`;
            }
            if (msg && subscription?.immediate_email && subscription?.User) {
                // kick off async call and immediately return
                (0, emails_1.sendImmediateNotificationEmail)(subscription.User, msg);
            }
        }
        const erc20Tokens = (await models.Chain.findAll({
            where: {
                base: types_1.ChainBase.Ethereum,
                type: types_1.ChainType.Token,
            }
        })).map((o) => o.id);
        // send data to relevant webhooks
        if (webhook_data && (
        // TODO: this OR clause seems redundant?
        webhook_data.chainEventType?.chain || !erc20Tokens.includes(webhook_data.chainEventType?.chain))) {
            await (0, webhookNotifier_1.default)(models, {
                notificationCategory: category_id,
                ...webhook_data
            });
        }
        return notification;
    };
    Subscription.associate = (models) => {
        models.Subscription.belongsTo(models.User, { foreignKey: 'subscriber_id', targetKey: 'id' });
        models.Subscription.belongsTo(models.NotificationCategory, { foreignKey: 'category_id', targetKey: 'name' });
        models.Subscription.hasMany(models.NotificationsRead, { foreignKey: 'subscription_id', onDelete: 'cascade' });
        models.Subscription.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
        models.Subscription.belongsTo(models.Thread, { foreignKey: 'offchain_thread_id', targetKey: 'id' });
        models.Subscription.belongsTo(models.ChainEventType, { foreignKey: 'chain_event_type_id', targetKey: 'id' });
        models.Subscription.belongsTo(models.ChainEntityMeta, { foreignKey: 'chain_entity_id', targetKey: 'id' });
        models.Subscription.belongsTo(models.Comment, { foreignKey: 'offchain_comment_id', targetKey: 'id' });
    };
    return Subscription;
};
