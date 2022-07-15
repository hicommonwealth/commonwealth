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
        this.log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [interfaces_1.SupportedNetwork.Aave, this._name]));
    }
    /**
     * Initializes subscription to chain and starts emitting events.
     */
    subscribe(cb) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            this._listener = (event) => {
                const logStr = `Received ${this._name} event: ${JSON.stringify(event, null, 2)}.`;
                // eslint-disable-next-line no-unused-expressions
                this._verbose ? this.log.info(logStr) : this.log.trace(logStr);
                cb(event);
            };
            this._api.governance.on('*', this._listener);
            (_a = this._api.aaveToken) === null || _a === void 0 ? void 0 : _a.on('*', this._listener);
            (_b = this._api.stkAaveToken) === null || _b === void 0 ? void 0 : _b.on('*', this._listener);
        });
    }
    unsubscribe() {
        var _a, _b;
        if (this._listener) {
            this._api.governance.off('*', this._listener);
            (_a = this._api.aaveToken) === null || _a === void 0 ? void 0 : _a.off('*', this._listener);
            (_b = this._api.stkAaveToken) === null || _b === void 0 ? void 0 : _b.off('*', this._listener);
            this._listener = null;
        }
    }
}
exports.Subscriber = Subscriber;
//# sourceMappingURL=subscriber.js.map