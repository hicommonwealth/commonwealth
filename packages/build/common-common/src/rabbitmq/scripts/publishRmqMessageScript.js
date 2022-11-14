"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("common-common/src/rabbitmq/util");
const types_1 = require("chain-events/src/chains/aave/types");
const src_1 = require("chain-events/src");
const uuid_1 = require("uuid");
const rabbitmq_1 = require("common-common/src/rabbitmq");
const config_1 = require("commonwealth/server/config");
async function publishRmqMessageScript() {
    const ceData = {
        kind: types_1.EventKind.Transfer,
        tokenAddress: uuid_1.v4(),
        from: uuid_1.v4(),
        to: uuid_1.v4(),
        amount: uuid_1.v4()
    };
    // // create a fake aave-transfer event
    const chainEvent = {
        blockNumber: Math.floor(Math.random() * 1000000),
        data: ceData,
        network: src_1.SupportedNetwork.Aave,
        chain: 'aave'
    };
    const publishJson = await util_1.publishRmqMsg(config_1.RABBITMQ_API_URI, rabbitmq_1.RascalExchanges.ChainEvents, rabbitmq_1.RascalRoutingKeys.ChainEvents, chainEvent);
    console.log(publishJson);
}
publishRmqMessageScript();
