"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const chain_entity_1 = __importDefault(require("./models/chain_entity"));
const chain_event_1 = __importDefault(require("./models/chain_event"));
const chain_event_type_1 = __importDefault(require("./models/chain_event_type"));
const sequelize_1 = require("sequelize");
const config_1 = require("../config");
const logging_1 = require("../../../common-common/src/logging");
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
const models = {
    ChainEntity: (0, chain_entity_1.default)(exports.sequelize, sequelize_1.DataTypes),
    ChainEvent: (0, chain_event_1.default)(exports.sequelize, sequelize_1.DataTypes),
    ChainEventType: (0, chain_event_type_1.default)(exports.sequelize, sequelize_1.DataTypes),
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
