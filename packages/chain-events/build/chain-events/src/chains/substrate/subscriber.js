"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscriber = void 0;
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
class Subscriber extends interfaces_1.IEventSubscriber {
    _api;
    _verbose;
    _subscription;
    _versionName;
    _versionNumber;
    log;
    constructor(_api, _verbose = false, chain) {
        super(_api);
        this._api = _api;
        this._verbose = _verbose;
        this.log = logging_1.factory.getLogger((0, logging_1.addPrefix)(__filename, [interfaces_1.SupportedNetwork.Substrate, chain]));
    }
    /**
     * Initializes subscription to chain and starts emitting events.
     */
    async subscribe(cb) {
        // wait for version available before we start producing blocks
        await new Promise((resolve) => {
            this._api.rpc.state.subscribeRuntimeVersion((version) => {
                this._versionNumber = +version.specVersion;
                this._versionName = version.specName.toString();
                this.log.info(`Fetched runtime version for ${this._versionName}: ${this._versionNumber}`);
                resolve();
            });
        });
        // subscribe to events and pass to block processor
        this._subscription = await this._api.rpc.chain.subscribeNewHeads(async (header) => {
            const events = await this._api.query.system.events.at(header.hash);
            const signedBlock = await this._api.rpc.chain.getBlock(header.hash);
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
