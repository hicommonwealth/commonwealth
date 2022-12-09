"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getForumNotificationCopy = void 0;
const types_1 = require("../../common-common/src/types");
const utils_1 = require("./utils");
// forum notification format:
// raymondz (mae7...) commented on 'Example Thread' in Edgeware
const getForumNotificationCopy = async (models, notification_data, category_id) => {
    // unpack notification_data
    const { created_at, root_id, root_title, root_type, comment_id, comment_text, chain_id, author_address, author_chain } = notification_data;
    // title
    const decodedTitle = decodeURIComponent(root_title).trim();
    // email subject line
    const emailSubjectLine = ((category_id === types_1.NotificationCategories.NewComment) ? `Comment on: ${decodedTitle}`
        : (category_id === types_1.NotificationCategories.NewMention) ? `You were mentioned in: ${decodedTitle}`
            : (category_id === types_1.NotificationCategories.NewCollaboration) ? `You were added as a collaborator on: ${decodedTitle}`
                : (category_id === types_1.NotificationCategories.NewThread) ? `New thread: ${decodedTitle}`
                    : 'New activity on Commonwealth');
    // author
    const authorProfile = await models.OffchainProfile.findOne({
        include: [{
                model: models.Address,
                where: { address: author_address, chain: author_chain || null },
                required: true,
            }]
    });
    let authorName;
    const author_addr_short = (0, utils_1.formatAddressShort)(author_address, author_chain, true);
    try {
        authorName = authorProfile.Address.name || JSON.parse(authorProfile.data).name || author_addr_short;
    }
    catch (e) {
        authorName = author_addr_short;
    }
    // author profile link
    const authorPath = `https://commonwealth.im/${author_chain}/account/${author_address}?base=${author_chain}`;
    // action and community
    const actionCopy = (([types_1.NotificationCategories.NewComment, types_1.NotificationCategories.CommentEdit].includes(category_id)) ? 'commented on'
        : (category_id === types_1.NotificationCategories.NewMention) ? 'mentioned you in the thread'
            : (category_id === types_1.NotificationCategories.NewCollaboration) ? 'invited you to collaborate on'
                : [types_1.NotificationCategories.ThreadEdit, types_1.NotificationCategories.NewThread].includes(category_id) ? 'created a new thread'
                    : null);
    const objectCopy = decodeURIComponent(root_title).trim();
    const communityObject = await models.Chain.findOne({ where: { id: chain_id } });
    const communityCopy = communityObject ? `in ${communityObject.name}` : '';
    const excerpt = (() => {
        const text = decodeURIComponent(comment_text);
        try {
            // return rendered quill doc
            const doc = JSON.parse(text);
            if (!doc.ops)
                throw new Error();
            const finalText = (0, utils_1.renderQuillDeltaToText)(doc);
            return (0, utils_1.smartTrim)(finalText);
        }
        catch (e) {
            // return markdown
            return (0, utils_1.smartTrim)(text);
        }
    })();
    // link to proposal
    const pseudoProposal = {
        id: root_id,
        title: root_title,
        chain: chain_id,
    };
    const proposalUrlArgs = comment_id ? [root_type, pseudoProposal, { id: comment_id }] : [root_type, pseudoProposal];
    const proposalPath = utils_1.getProposalUrl(...proposalUrlArgs);
    return [emailSubjectLine, authorName, actionCopy, objectCopy, communityCopy, excerpt, proposalPath, authorPath];
};
exports.getForumNotificationCopy = getForumNotificationCopy;
// chain event label: (chainEventLabel?.heading)
// chain event path:
// chainEventLabel?.linkUrl ? `${SERVER_URL}${chainEventLabel.linkUrl}`
// : chainEventLabel ? `${SERVER_URL}/${chainId}`
