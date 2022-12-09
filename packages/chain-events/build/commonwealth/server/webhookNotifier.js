"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const superagent_1 = __importDefault(require("superagent"));
const sequelize_1 = require("sequelize");
const lodash_1 = require("lodash");
const src_1 = require("../../chain-events/src");
const types_1 = require("../../common-common/src/types");
const utils_1 = require("../shared/utils");
const config_1 = require("./config");
const REGEX_IMAGE = /\b(https?:\/\/\S*?\.(?:png|jpe?g|gif)(?:\?(?:(?:(?:[\w_-]+=[\w_-]+)(?:&[\w_-]+=[\w_-]+)*)|(?:[\w_-]+)))?)\b/;
const REGEX_EMOJI = /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g;
const getFilteredContent = (content, address) => {
    if (content.chainEvent && content.chainEventType) {
        // construct compatible CW event from DB by inserting network from type
        const evt = {
            blockNumber: content.chainEvent.block_number,
            data: content.chainEvent.event_data,
            network: content.chainEventType.event_network,
        };
        const event = (0, src_1.Label)(content.chainEventType.chain, evt);
        const title = `${(0, lodash_1.capitalize)(content.chainEventType.chain)}`;
        const chainEventLink = `${config_1.SERVER_URL}/${content.chainEventType.chain}`;
        const fulltext = `${event.heading} on ${(0, lodash_1.capitalize)(content.chainEventType?.chain)} at block`
            + ` ${content.chainEvent?.block_number} \n${event.label}`;
        return { title, fulltext, chainEventLink };
    }
    else {
        const community = `${content.chain || content.community}`;
        const actor = `${address?.name || content.user}`;
        const action = ((content.notificationCategory === types_1.NotificationCategories.NewComment) ? 'commented on'
            : (content.notificationCategory === types_1.NotificationCategories.NewMention) ? 'mentioned you in the thread'
                : (content.notificationCategory === types_1.NotificationCategories.NewCollaboration) ? 'invited you to collaborate on'
                    : (content.notificationCategory === types_1.NotificationCategories.NewThread) ? 'created a new thread'
                        : '');
        const actedOn = decodeURIComponent(content.title);
        const actedOnLink = content.url;
        const notificationTitlePrefix = content.notificationCategory === types_1.NotificationCategories.NewComment
            ? 'Comment on: '
            : content.notificationCategory === types_1.NotificationCategories.NewThread ? 'New thread: '
                : content.notificationCategory === types_1.NotificationCategories.NewReaction ? 'Reaction on: '
                    : 'Activity on: ';
        // url decoded
        const bodytext = decodeURIComponent(content.body);
        const notificationPreviewImageUrl = (() => {
            // retrieves array of matching `bodytext` against REGEX_IMAGE
            const matches = bodytext.match(REGEX_IMAGE);
            // in case, it doesn't contain any images
            if (!matches)
                return null;
            // return the first image urleh
            return matches[0];
        })();
        const notificationExcerpt = (() => {
            try {
                // parse and use quill document
                const doc = JSON.parse(bodytext);
                if (!doc.ops)
                    throw new Error();
                const text = (0, utils_1.renderQuillDeltaToText)(doc);
                return (0, utils_1.smartTrim)(text);
            }
            catch (err) {
                // use markdown document directly
                return (0, utils_1.smartTrim)(bodytext);
            }
        })();
        return { community, actor, action, actedOn, actedOnLink, notificationTitlePrefix, notificationExcerpt, notificationPreviewImageUrl };
    }
};
const send = async (models, content) => {
    let address;
    try {
        address = await models.Address.findOne({ where: { address: content.user, chain: content.author_chain } });
    }
    catch (err) {
        // pass nothing if no matching address is found
    }
    // if a community is passed with the content, we know that it is from a community
    const chainOrCommObj = (content.chain) ? { chain_id: content.chain } : null;
    const notificationCategory = (content.chainEvent)
        ? content.chainEvent.chain_event_type_id : content.notificationCategory;
    // grab all webhooks for specific community
    const chainOrCommWebhooks = await models.Webhook.findAll({
        where: {
            ...chainOrCommObj,
            categories: {
                [sequelize_1.Op.contains]: [notificationCategory],
            },
        },
    });
    const chainOrCommwebhookUrls = [];
    chainOrCommWebhooks.forEach((wh) => {
        if ((0, utils_1.validURL)(wh.url)) {
            chainOrCommwebhookUrls.push(wh.url);
        }
    });
    const { community, actor, action, actedOn, actedOnLink, notificationTitlePrefix, notificationExcerpt, notificationPreviewImageUrl, // forum events
    title, chainEventLink, fulltext // chain events
     } = getFilteredContent(content, address);
    const isChainEvent = !!chainEventLink;
    let actorAvatarUrl = null;
    const actorAccountLink = address ? `${config_1.SERVER_URL}/${address.chain}/account/${address.address}` : null;
    if (address?.id) {
        const actorProfile = await models.OffchainProfile.findOne({ where: { address_id: address.id } });
        if (actorProfile?.data) {
            actorAvatarUrl = JSON.parse(actorProfile.data).avatarUrl;
        }
    }
    let previewImageUrl = null; // image url of webhook preview
    let previewAltText = null; // Alt text of preview image
    // First case
    if (!isChainEvent) {
        // if event (thread or comment), need to show embedded image as preview
        if (notificationPreviewImageUrl) {
            previewImageUrl = notificationPreviewImageUrl;
            previewAltText = 'Embedded';
        }
    }
    // Second case
    if (!previewImageUrl) {
        if (content.chain) {
            // if the chain has a logo, show it as preview image
            const chain = await models.Chain.findOne({ where: { id: content.chain } });
            if (chain) {
                if (chain.icon_url) {
                    previewImageUrl = (chain.icon_url.match(`^(http|https)://`)) ? chain.icon_url :
                        `https://commonwealth.im${chain.icon_url}`;
                }
                // can't handle the prefix of `previeImageUrl` with SERVER_URL
                // because social platforms can't access to localhost:8080.
                previewAltText = chain.name;
            }
        }
    }
    // Third case
    if (!previewImageUrl) {
        // if no embedded image url or the chain/community doesn't have a logo, show the Commonwealth logo as the preview image
        previewImageUrl = previewImageUrl || config_1.DEFAULT_COMMONWEALTH_LOGO;
        previewAltText = previewAltText || 'Commonwealth';
    }
    await Promise.all(chainOrCommwebhookUrls
        .filter((url) => !!url)
        .map(async (url) => {
        let webhookData;
        if (url.indexOf('slack.com') !== -1) {
            // slack webhook format (stringified JSON)
            webhookData = JSON.stringify({
                blocks: [
                    {
                        type: 'context',
                        elements: actorAvatarUrl?.length ? [
                            {
                                type: 'image',
                                image_url: actorAvatarUrl,
                                alt_text: 'Actor:'
                            },
                            {
                                type: 'mrkdwn',
                                text: `<${actorAccountLink}|${actor}>`,
                            }
                        ] : [
                            {
                                type: 'plain_text',
                                text: actor,
                            }
                        ]
                    },
                    {
                        type: 'section',
                        text: isChainEvent ? {
                            type: 'mrkdwn',
                            text: (process.env.NODE_ENV !== 'production' ? '[dev] ' : '') + fulltext
                        } : {
                            type: 'mrkdwn',
                            text: `*${process.env.NODE_ENV !== 'production' ? '[dev] ' : ''}${notificationTitlePrefix}* <${actedOnLink}|${actedOn}> \n> ${notificationExcerpt.split('\n').join('\n> ')}`
                        },
                        accessory: {
                            type: 'image',
                            image_url: previewImageUrl,
                            alt_text: previewAltText
                        }
                    }
                ],
            });
        }
        else if (url.indexOf('discord.com') !== -1) {
            // discord webhook format (raw json, for application/json)
            webhookData = isChainEvent ? {
                username: 'Commonwealth',
                avatar_url: config_1.DEFAULT_COMMONWEALTH_LOGO,
                embeds: [{
                        author: {
                            name: 'New chain event',
                            url: chainEventLink,
                            icon_url: previewImageUrl
                        },
                        title,
                        url: chainEventLink,
                        description: fulltext,
                        color: 15258703,
                        thumbnail: {
                            'url': previewImageUrl
                        },
                    }]
            } : {
                username: 'Commonwealth',
                avatar_url: config_1.DEFAULT_COMMONWEALTH_LOGO,
                embeds: [{
                        author: {
                            name: actor,
                            url: actorAccountLink,
                            icon_url: actorAvatarUrl
                        },
                        title: notificationTitlePrefix + actedOn,
                        url: actedOnLink,
                        description: notificationExcerpt.replace(REGEX_EMOJI, ''),
                        color: 15258703,
                        thumbnail: {
                            'url': previewImageUrl
                        },
                    }]
            };
        }
        else if (url.indexOf('matrix') !== -1) {
            // TODO: matrix format and URL pattern matcher unimplemented
            // return {
            //   'text': `${getFiltered(content, address).join('\n')}`,
            //   'format': 'plain',
            //   'displayName': 'Commonwealth',
            //   'avatarUrl': 'http://commonwealthLogoGoesHere'
            // };
        }
        else if ((url.indexOf('telegram') !== -1) && process.env.TELEGRAM_BOT_TOKEN) {
            let getChatUsername = url.split('/@');
            getChatUsername = `@${getChatUsername[1]}`;
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            const getUpdatesUrl = `https://api.telegram.org/${process.env.TELEGRAM_BOT_TOKEN}`;
            url = `${getUpdatesUrl}/sendMessage`;
            webhookData = isChainEvent ? {
                chat_id: getChatUsername,
                text: `<a href="${chainEventLink}"><b>${title}</b></a>\n\n${fulltext}`,
                parse_mode: 'HTML',
                reply_markup: {
                    'resize_keyboard': true,
                    'inline_keyboard': [
                        [
                            { 'text': 'Read more on commonwealth', 'url': chainEventLink }
                        ]
                    ]
                }
            } : {
                chat_id: getChatUsername,
                text: `<b>Author:</b> <a href="${actorAccountLink}">${actor}</a>\n<a href="${actedOnLink}"><b>${notificationTitlePrefix + actedOn}</b></a> \r\n\n${notificationExcerpt.replace(REGEX_EMOJI, '')}`,
                parse_mode: 'HTML',
                reply_markup: {
                    'resize_keyboard': true,
                    'inline_keyboard': [
                        [
                            { 'text': 'Read more on commonwealth', 'url': actedOnLink }
                        ]
                    ]
                }
            };
        }
        else {
            // TODO: other formats unimplemented
        }
        if (!webhookData) {
            console.error('webhook not supported');
            return;
        }
        try {
            if (process.env.NODE_ENV === 'production' || (config_1.SLACK_FEEDBACK_WEBHOOK && url === config_1.SLACK_FEEDBACK_WEBHOOK)) {
                await superagent_1.default.post(url).send(webhookData);
            }
            else {
                console.log('Suppressed webhook notification to', url);
            }
        }
        catch (err) {
            console.error(err);
        }
    }));
};
exports.default = send;
