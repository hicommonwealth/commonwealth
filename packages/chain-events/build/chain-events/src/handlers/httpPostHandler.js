"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpPostHandler = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const logging_1 = require("../logging");
class httpPostHandler {
    url;
    constructor(url) {
        this.url = url;
    }
    async handle(event) {
        const log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [event.network, event.chain]));
        try {
            const res = await (0, node_fetch_1.default)(this.url, {
                method: 'POST',
                body: JSON.stringify(event),
                headers: { 'Content-Type': 'application/json' },
            });
            // throw if there is an error
            log.info(`Post request status code: ${res.status}`);
            if (!res.ok)
                throw res;
            // log post request response
            log.info(await res.json());
        }
        catch (error) {
            log.error(`Error posting event ${event} to ${this.url}`);
            // log error info returned by the server if any
            log.error(await error.text());
        }
    }
}
exports.httpPostHandler = httpPostHandler;
