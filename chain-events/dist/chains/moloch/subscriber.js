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
    constructor(api, name, verbose = false) {
        super(api, verbose);
        this._name = name;
        this.log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Moloch, this._name]));
    }
    /**
     * Initializes subscription to chain and starts emitting events.
     */
    subscribe(cb) {
        return __awaiter(this, void 0, void 0, function* () {
            this._listener = (event) => {
                const logStr = `Received ${this._name} event: ${JSON.stringify(event, null, 2)}.`;
                // eslint-disable-next-line no-unused-expressions
                this._verbose ? this.log.info(logStr) : this.log.trace(logStr);
                cb(event);
            };
            this._api.on('*', this._listener);
        });
    }
    unsubscribe() {
        if (this._listener) {
            this.log.info(`Unsubscribing from ${this._name}`);
            this._api.removeListener('*', this._listener);
            this._listener = null;
        }
    }
}
exports.Subscriber = Subscriber;
//# sourceMappingURL=subscriber.js.map