"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpToJSON = void 0;
const ethers_1 = require("ethers");
const OpToJSON = (op) => {
    return Object.keys(op)
        .map((key) => {
        let val = op[key];
        if (typeof val !== "string" || !val.startsWith("0x")) {
            val = ethers_1.ethers.utils.hexValue(val);
        }
        return [key, val];
    })
        .reduce((set, [k, v]) => (Object.assign(Object.assign({}, set), { [k]: v })), {});
};
exports.OpToJSON = OpToJSON;
