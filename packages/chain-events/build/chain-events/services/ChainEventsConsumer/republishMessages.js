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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepublishMessages = void 0;
const rabbitmq_1 = require("../../../common-common/src/rabbitmq");
const Sequelize = __importStar(require("sequelize"));
/**
 * A worker that periodically republishes data from the database if it's queued value is between -1 and 5. A queued
 * value of -1
 *
 */
class RepublishMessages extends rabbitmq_1.RepublishFailedMessages {
    constructor(_rmqController, _models) {
        super(_rmqController, _models, 180000);
    }
    async job() {
        const result = await this._models.ChainEventType.findAll({
            where: {
                queued: {
                    [Sequelize.Op.between]: [-1, 5],
                },
            },
        });
        // TODO
        if (result.length > 100) { }
        for (const eventType of result) {
            const publishData = {
                chainEventTypeId: eventType.id,
                cud: 'create',
            };
            await this._rmqController.safePublish(publishData, eventType.id, rabbitmq_1.RascalPublications.ChainEventTypeCUDMain, {
                sequelize: this._models.sequelize,
                model: this._models.ChainEventType,
            });
        }
    }
}
exports.RepublishMessages = RepublishMessages;
