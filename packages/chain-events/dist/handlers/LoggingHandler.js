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
exports.LoggingHandler = void 0;
const interfaces_1 = require("../interfaces");
const logging_1 = require("../logging");
class LoggingHandler extends interfaces_1.IEventHandler {
    handle(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const log = logging_1.factory.getLogger(logging_1.addPrefix(__filename, [event.network, event.chain]));
            log.info(`Received event: ${JSON.stringify(event, null, 2)}`);
            return null;
        });
    }
}
exports.LoggingHandler = LoggingHandler;
//# sourceMappingURL=LoggingHandler.js.map