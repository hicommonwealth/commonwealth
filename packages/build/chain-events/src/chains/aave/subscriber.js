"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscriber = void 0;
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
class Subscriber extends interfaces_1.IEventSubscriber {
    _name;
    _listener;
    log;
    constructor(api, name, verbose = false) {
        super(api, verbose);
        this._name = name;
        this.log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Aave, this._name]));
    }
    /**
     * Initializes subscription to chain and starts emitting events.
     */
    async subscribe(cb) {
        this._listener = (event) => {
            const logStr = `Received ${this._name} event: ${JSON.stringify(event, null, 2)}.`;
            // eslint-disable-next-line no-unused-expressions
            this._verbose ? this.log.info(logStr) : this.log.trace(logStr);
            cb(event);
        };
        this._api.governance.on('*', this._listener);
        this._api.aaveToken?.on('*', this._listener);
        this._api.stkAaveToken?.on('*', this._listener);
    }
    unsubscribe() {
        if (this._listener) {
            this._api.governance.off('*', this._listener);
            this._api.aaveToken?.off('*', this._listener);
            this._api.stkAaveToken?.off('*', this._listener);
            this._listener = null;
        }
    }
}
exports.Subscriber = Subscriber;
