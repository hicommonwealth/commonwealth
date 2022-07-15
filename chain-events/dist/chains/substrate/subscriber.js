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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscriber = void 0;
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
class Subscriber extends interfaces_1.IEventSubscriber {
    constructor(_api, _verbose = false, chain) {
        super(_api);
        this._api = _api;
        this._verbose = _verbose;
        this.log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Substrate, chain]));
    }
    /**
     * Initializes subscription to chain and starts emitting events.
     */
    subscribe(cb) {
        return __awaiter(this, void 0, void 0, function* () {
            // wait for version available before we start producing blocks
            yield new Promise((resolve) => {
                this._api.rpc.state.subscribeRuntimeVersion((version) => {
                    this._versionNumber = +version.specVersion;
                    this._versionName = version.specName.toString();
                    this.log.info(`Fetched runtime version for ${this._versionName}: ${this._versionNumber}`);
                    resolve();
                });
            });
            // subscribe to events and pass to block processor
            this._subscription = yield this._api.rpc.chain.subscribeNewHeads((header) => __awaiter(this, void 0, void 0, function* () {
                const events = yield this._api.query.system.events.at(header.hash);
                const signedBlock = yield this._api.rpc.chain.getBlock(header.hash);
                const { extrinsics } = signedBlock.block;
                const block = {
                    header,
                    events,
                    extrinsics,
                    versionNumber: this._versionNumber,
                    versionName: this._versionName,
                };
                const logStr = `Fetched Block for ${this._versionName}:${this._versionNumber}: ${+block.header.number}`;
                // eslint-disable-next-line no-unused-expressions
                this._verbose ? this.log.info(logStr) : this.log.trace(logStr);
                cb(block);
            }));
        });
    }
    unsubscribe() {
        if (this._subscription) {
            this.log.info(`Unsubscribing from ${this._versionName}`);
            this._subscription();
            this._subscription = null;
        }
        else {
            this.log.info(`No subscriber to unsubscribe from`);
        }
    }
}
exports.Subscriber = Subscriber;
//# sourceMappingURL=subscriber.js.map