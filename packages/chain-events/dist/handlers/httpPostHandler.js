"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpPostHandler = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const logging_1 = require("../logging");
class httpPostHandler {
    constructor(url) {
        this.url = url;
    }
    handle(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [event.network, event.chain]));
            try {
                const res = yield node_fetch_1.default(this.url, {
                    method: 'POST',
                    body: JSON.stringify(event),
                    headers: { 'Content-Type': 'application/json' },
                });
                // throw if there is an error
                log.info(`Post request status code: ${res.status}`);
                if (!res.ok)
                    throw res;
                // log post request response
                log.info(yield res.json());
            }
            catch (error) {
                log.error(`Error posting event ${event} to ${this.url}`);
                // log error info returned by the server if any
                log.error(yield error.text());
            }
        });
    }
}
exports.httpPostHandler = httpPostHandler;
//# sourceMappingURL=httpPostHandler.js.map