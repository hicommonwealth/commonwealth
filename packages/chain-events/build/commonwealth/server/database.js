"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Address = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const logging_1 = require("../../common-common/src/logging");
const config_1 = require("./config");
const address_1 = __importDefault(require("./models/address"));
const attachment_1 = __importDefault(require("./models/attachment"));
const ban_1 = __importDefault(require("./models/ban"));
const chain_1 = __importDefault(require("./models/chain"));
const chain_category_1 = __importDefault(require("./models/chain_category"));
const chain_category_type_1 = __importDefault(require("./models/chain_category_type"));
const chain_entity_meta_1 = __importDefault(require("./models/chain_entity_meta"));
const chain_event_type_1 = __importDefault(require("./models/chain_event_type"));
const chain_node_1 = __importDefault(require("./models/chain_node"));
const chat_channel_1 = __importDefault(require("./models/chat_channel"));
const chat_message_1 = __importDefault(require("./models/chat_message"));
const collaboration_1 = __importDefault(require("./models/collaboration"));
const comment_1 = __importDefault(require("./models/comment"));
const community_banner_1 = __importDefault(require("./models/community_banner"));
const community_contract_1 = __importDefault(require("./models/community_contract"));
const community_role_1 = __importDefault(require("./models/community_role"));
const contract_1 = __importDefault(require("./models/contract"));
const contract_abi_1 = __importDefault(require("./models/contract_abi"));
const discussion_draft_1 = __importDefault(require("./models/discussion_draft"));
const identity_cache_1 = __importDefault(require("./models/identity_cache"));
const invite_code_1 = __importDefault(require("./models/invite_code"));
const ipfs_pins_1 = __importDefault(require("./models/ipfs_pins"));
const linked_thread_1 = __importDefault(require("./models/linked_thread"));
const login_token_1 = __importDefault(require("./models/login_token"));
const notification_1 = __importDefault(require("./models/notification"));
const notifications_read_1 = __importDefault(require("./models/notifications_read"));
const notification_category_1 = __importDefault(require("./models/notification_category"));
const offchain_profile_1 = __importDefault(require("./models/offchain_profile"));
const poll_1 = __importDefault(require("./models/poll"));
const profile_1 = __importDefault(require("./models/profile"));
const reaction_1 = __importDefault(require("./models/reaction"));
const role_assignment_1 = __importDefault(require("./models/role_assignment"));
const role_1 = __importDefault(require("./models/role"));
const rule_1 = __importDefault(require("./models/rule"));
const social_account_1 = __importDefault(require("./models/social_account"));
const sso_token_1 = __importDefault(require("./models/sso_token"));
const starred_community_1 = __importDefault(require("./models/starred_community"));
const subscription_1 = __importDefault(require("./models/subscription"));
const tagged_threads_1 = __importDefault(require("./models/tagged_threads"));
const thread_1 = __importDefault(require("./models/thread"));
const token_1 = __importDefault(require("./models/token"));
const topic_1 = __importDefault(require("./models/topic"));
const user_1 = __importDefault(require("./models/user"));
const viewcount_1 = __importDefault(require("./models/viewcount"));
const vote_1 = __importDefault(require("./models/vote"));
const waitlist_registration_1 = __importDefault(require("./models/waitlist_registration"));
const webhook_1 = __importDefault(require("./models/webhook"));
const log = logging_1.factory.getLogger((0, logging_1.formatFilename)(__filename));
exports.sequelize = new sequelize_1.Sequelize(config_1.DATABASE_URI, {
    // disable string operators (https://github.com/sequelize/sequelize/issues/8417)
    // operatorsAliases: false,
    logging: process.env.NODE_ENV === 'test'
        ? false
        : (msg) => {
            log.trace(msg);
        },
    dialectOptions: process.env.NODE_ENV !== 'production'
        ? {
            requestTimeout: 40000,
        }
        : {
            requestTimeout: 40000,
            ssl: { rejectUnauthorized: false },
        },
    pool: {
        max: 10,
        min: 0,
        acquire: 40000,
        idle: 40000,
    },
});
exports.Address = (0, address_1.default)(exports.sequelize, sequelize_1.DataTypes);
const models = {
    Address: (0, address_1.default)(exports.sequelize, sequelize_1.DataTypes),
    Ban: (0, ban_1.default)(exports.sequelize, sequelize_1.DataTypes),
    Chain: (0, chain_1.default)(exports.sequelize, sequelize_1.DataTypes),
    ChainCategory: (0, chain_category_1.default)(exports.sequelize, sequelize_1.DataTypes),
    ChainCategoryType: (0, chain_category_type_1.default)(exports.sequelize, sequelize_1.DataTypes),
    ChainNode: (0, chain_node_1.default)(exports.sequelize, sequelize_1.DataTypes),
    ChatChannel: (0, chat_channel_1.default)(exports.sequelize, sequelize_1.DataTypes),
    ChainEntityMeta: (0, chain_entity_meta_1.default)(exports.sequelize, sequelize_1.DataTypes),
    ChainEventType: (0, chain_event_type_1.default)(exports.sequelize, sequelize_1.DataTypes),
    ChatMessage: (0, chat_message_1.default)(exports.sequelize, sequelize_1.DataTypes),
    Collaboration: (0, collaboration_1.default)(exports.sequelize, sequelize_1.DataTypes),
    Contract: (0, contract_1.default)(exports.sequelize, sequelize_1.DataTypes),
    ContractAbi: (0, contract_abi_1.default)(exports.sequelize, sequelize_1.DataTypes),
    CommunityContract: (0, community_contract_1.default)(exports.sequelize, sequelize_1.DataTypes),
    CommunityBanner: (0, community_banner_1.default)(exports.sequelize, sequelize_1.DataTypes),
    CommunityRole: (0, community_role_1.default)(exports.sequelize, sequelize_1.DataTypes),
    DiscussionDraft: (0, discussion_draft_1.default)(exports.sequelize, sequelize_1.DataTypes),
    IdentityCache: (0, identity_cache_1.default)(exports.sequelize, sequelize_1.DataTypes),
    InviteCode: (0, invite_code_1.default)(exports.sequelize, sequelize_1.DataTypes),
    IpfsPins: (0, ipfs_pins_1.default)(exports.sequelize, sequelize_1.DataTypes),
    LinkedThread: (0, linked_thread_1.default)(exports.sequelize, sequelize_1.DataTypes),
    LoginToken: (0, login_token_1.default)(exports.sequelize, sequelize_1.DataTypes),
    Notification: (0, notification_1.default)(exports.sequelize, sequelize_1.DataTypes),
    NotificationCategory: (0, notification_category_1.default)(exports.sequelize, sequelize_1.DataTypes),
    NotificationsRead: (0, notifications_read_1.default)(exports.sequelize, sequelize_1.DataTypes),
    Attachment: (0, attachment_1.default)(exports.sequelize, sequelize_1.DataTypes),
    Comment: (0, comment_1.default)(exports.sequelize, sequelize_1.DataTypes),
    Poll: (0, poll_1.default)(exports.sequelize, sequelize_1.DataTypes),
    OffchainProfile: (0, offchain_profile_1.default)(exports.sequelize, sequelize_1.DataTypes),
    Reaction: (0, reaction_1.default)(exports.sequelize, sequelize_1.DataTypes),
    Thread: (0, thread_1.default)(exports.sequelize, sequelize_1.DataTypes),
    Topic: (0, topic_1.default)(exports.sequelize, sequelize_1.DataTypes),
    ViewCount: (0, viewcount_1.default)(exports.sequelize, sequelize_1.DataTypes),
    Vote: (0, vote_1.default)(exports.sequelize, sequelize_1.DataTypes),
    Profile: (0, profile_1.default)(exports.sequelize, sequelize_1.DataTypes),
    Role: (0, role_1.default)(exports.sequelize, sequelize_1.DataTypes),
    RoleAssignment: (0, role_assignment_1.default)(exports.sequelize, sequelize_1.DataTypes),
    Rule: (0, rule_1.default)(exports.sequelize, sequelize_1.DataTypes),
    SocialAccount: (0, social_account_1.default)(exports.sequelize, sequelize_1.DataTypes),
    SsoToken: (0, sso_token_1.default)(exports.sequelize, sequelize_1.DataTypes),
    StarredCommunity: (0, starred_community_1.default)(exports.sequelize, sequelize_1.DataTypes),
    Subscription: (0, subscription_1.default)(exports.sequelize, sequelize_1.DataTypes),
    Token: (0, token_1.default)(exports.sequelize, sequelize_1.DataTypes),
    TaggedThread: (0, tagged_threads_1.default)(exports.sequelize, sequelize_1.DataTypes),
    User: (0, user_1.default)(exports.sequelize, sequelize_1.DataTypes),
    WaitlistRegistration: (0, waitlist_registration_1.default)(exports.sequelize, sequelize_1.DataTypes),
    Webhook: (0, webhook_1.default)(exports.sequelize, sequelize_1.DataTypes),
};
const db = {
    sequelize: exports.sequelize,
    Sequelize: sequelize_1.Sequelize,
    ...models,
};
// setup associations
Object.keys(models).forEach((modelName) => {
    if ('associate' in db[modelName]) {
        db[modelName].associate(db);
    }
});
exports.default = db;
