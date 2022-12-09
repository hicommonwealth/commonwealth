"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBatchedNotificationEmails = exports.sendImmediateNotificationEmail = exports.createImmediateNotificationEmailObject = void 0;
const sequelize_1 = require("sequelize");
const lodash_1 = require("lodash");
const src_1 = require("../../../chain-events/src");
const logging_1 = require("../../../common-common/src/logging");
const types_1 = require("../../../common-common/src/types");
const config_1 = require("../config");
const notificationFormatter_1 = require("../../shared/notificationFormatter");
const types_2 = require("../../shared/types");
const log = logging_1.factory.getLogger((0, logging_1.formatFilename)(__filename));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(config_1.SENDGRID_API_KEY);
const createImmediateNotificationEmailObject = async (notification_data, category_id, models) => {
    if (notification_data.chainEvent && notification_data.chainEventType) {
        // construct compatible CW event from DB by inserting network from type
        const evt = {
            blockNumber: notification_data.chainEvent.block_number,
            data: notification_data.chainEvent.event_data,
            network: notification_data.chainEventType.event_network,
        };
        try {
            const chainEventLabel = (0, src_1.Label)(notification_data.chainEventType.chain, evt);
            if (!chainEventLabel)
                return;
            const subject = `${process.env.NODE_ENV !== 'production' ? '[dev] ' : ''}${chainEventLabel.heading} event on ${(0, lodash_1.capitalize)(notification_data.chainEventType.chain)}`;
            return {
                from: 'Commonwealth <no-reply@commonwealth.im>',
                to: null,
                bcc: null,
                subject,
                templateId: types_2.DynamicTemplate.ImmediateEmailNotification,
                dynamic_template_data: {
                    notification: {
                        chainId: notification_data.chainEventType.chain,
                        blockNumber: notification_data.chainEvent.blockNumber,
                        subject,
                        label: subject,
                        path: null,
                    }
                }
            };
        }
        catch (err) {
            console.error(`Failed to label chain event: ${err.message}`);
        }
    }
    else if (category_id !== types_1.NotificationCategories.NewReaction && category_id !== types_1.NotificationCategories.ThreadEdit) {
        const [emailSubjectLine, subjectCopy, actionCopy, objectCopy, communityCopy, excerpt, proposalPath, authorPath] = await (0, notificationFormatter_1.getForumNotificationCopy)(models, notification_data, category_id);
        return {
            from: 'Commonwealth <no-reply@commonwealth.im>',
            to: null,
            bcc: null,
            subject: (process.env.NODE_ENV !== 'production' ? '[dev] ' : '') + emailSubjectLine,
            templateId: types_2.DynamicTemplate.ImmediateEmailNotification,
            dynamic_template_data: {
                notification: {
                    subject: emailSubjectLine,
                    author: subjectCopy,
                    action: actionCopy,
                    rootObject: objectCopy,
                    community: communityCopy,
                    excerpt,
                    proposalPath,
                    authorPath,
                }
            }
        };
    }
};
exports.createImmediateNotificationEmailObject = createImmediateNotificationEmailObject;
const createNotificationDigestEmailObject = async (user, notifications, models) => {
    // const emailObjArray = await Promise.all(notifications.map(async (n) => {
    //   const s = await n.getSubscription();
    //   const { category_id } = s;
    //
    //   if (n.chain_event_id) {
    //     const chainEvent = await models.ChainEvent.findOne({
    //       where: { id: n.chain_event_id },
    //       include: [{
    //         model: models.ChainEventType,
    //         required: true,
    //         as: 'ChainEventType',
    //       }]
    //     });
    //     if (!chainEvent) return {};
    //
    //     // construct compatible CW event from DB by inserting network from type
    //     const evt: CWEvent = {
    //       blockNumber: chainEvent.block_number,
    //       data: chainEvent.event_data as IChainEventData,
    //       network: chainEvent.ChainEventType.event_network as SupportedNetwork,
    //     };
    //
    //     let label: IEventLabel;
    //     try {
    //       label = ChainEventLabel(s.chain_id, evt);
    //     } catch (e) {
    //       return {};
    //     }
    //
    //     const path = `https://commonwealth.im/${s.chain_id}/notifications`;
    //     let createdAt = moment(n.created_at).fromNow();
    //     if (createdAt === 'a day ago') createdAt = `${moment(Date.now()).diff(n.created_at, 'hours')} hours ago`;
    //     return {
    //       chainId: s.chain_id,
    //       blockNumber: chainEvent.block_number,
    //       label: label.heading,
    //       path: `https://commonwealth.im${label.linkUrl}`,
    //       createdAt,
    //     };
    //   } else {
    //     const notification_data = JSON.parse(n.notification_data);
    //     const [
    //       emailSubjectLine, subjectCopy, actionCopy, objectCopy, communityCopy, excerpt, proposalPath, authorPath
    //     ] = await getForumNotificationCopy(models, notification_data as IPostNotificationData, category_id);
    //
    //     if (actionCopy === null) return; // don't return notification object if object no-longer exists
    //
    //     let createdAt = moment(n.created_at).fromNow();
    //     if (createdAt === 'a day ago') createdAt = `${moment(Date.now()).diff(n.created_at, 'hours')} hours ago`;
    //     return {
    //       author: subjectCopy,
    //       action: actionCopy,
    //       rootObject: objectCopy,
    //       community: communityCopy,
    //       excerpt,
    //       proposalPath,
    //       authorPath,
    //       createdAt,
    //     };
    //   }
    // }));
    // // construct email
    // return {
    //   from: 'Commonwealth <no-reply@commonwealth.im>',
    //   to: null,
    //   bcc: null,
    //   templateId: DynamicTemplate.BatchNotifications,
    //   dynamic_template_data: {
    //     notifications: emailObjArray,
    //     subject: `${process.env.NODE_ENV !== 'production' ? '[dev] ' : ''
    //     }${notifications.length} new notification${notifications.length === 1 ? '' : 's'}`,
    //     user: user.email,
    //   },
    // };
};
const sendImmediateNotificationEmail = async (user, emailObject) => {
    if (!emailObject) {
        console.log('attempted to send empty immediate notification email');
        return;
    }
    emailObject.to = process.env.NODE_ENV === 'development' ? 'raymond@commonwealth.im' : user.email;
    emailObject.bcc = 'raymond+bcc@commonwealth.im';
    try {
        console.log(`sending immediate notification email to ${emailObject.to}`);
        await sgMail.send(emailObject);
    }
    catch (e) {
        console.log('Failed to send immediate notification email', e?.response?.body?.errors);
        log.error(e);
    }
};
exports.sendImmediateNotificationEmail = sendImmediateNotificationEmail;
const sendBatchedNotificationEmails = async (models) => {
    log.info('Sending daily notification emails');
    try {
        const users = await models.User.scope('withPrivateData').findAll({
            where: { emailNotificationInterval: 'daily' }
        });
        log.info(`Sending to ${users.length} users`);
        const last24hours = new Date(new Date() - 24 * 60 * 60 * 1000);
        await Promise.all(users.map(async (user) => {
            const notifications = await models.Notification.findAll({
                include: [{
                        model: models.Subscription,
                        where: { subscriber_id: user.id },
                    }],
                where: {
                    // is_read: false,
                    created_at: { [sequelize_1.Op.gt]: last24hours },
                },
                order: [
                    ['created_at', 'DESC'],
                ]
            });
            if (notifications.length === 0) {
                console.log(`empty digest for ${user.email}`);
                return; // don't notify if no new notifications in the last 24h
            }
            // send notification email
            try {
                console.log(`producing digest for ${user.email}`);
                // const emailObject = await createNotificationDigestEmailObject(user, notifications, models);
                // emailObject.to = process.env.NODE_ENV === 'development' ? 'raymond@commonwealth.im' : user.email;
                // emailObject.bcc = 'raymond+bcc@commonwealth.im';
                // console.log(`sending batch notification email to ${user.email}`);
                // await sgMail.send(emailObject);
            }
            catch (e) {
                console.log('Failed to send batch notification email', e);
            }
        }));
        return 0;
    }
    catch (e) {
        console.log(e.message);
        return 1;
    }
};
exports.sendBatchedNotificationEmails = sendBatchedNotificationEmails;
