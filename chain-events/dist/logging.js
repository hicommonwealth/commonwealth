"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.factoryControl = exports.factory = exports.addPrefix = exports.formatFilename = void 0;
const typescript_logging_1 = require("typescript-logging");
const options = new typescript_logging_1.LoggerFactoryOptions()
    .addLogGroupRule(new typescript_logging_1.LogGroupRule(new RegExp('model.+'), typescript_logging_1.LogLevel.Debug))
    .addLogGroupRule(new typescript_logging_1.LogGroupRule(new RegExp('route.+'), typescript_logging_1.LogLevel.Debug))
    .addLogGroupRule(new typescript_logging_1.LogGroupRule(new RegExp('.+'), typescript_logging_1.LogLevel.Info));
const formatFilename = (name) => {
    const t = name.split('/');
    return t[t.length - 1];
};
exports.formatFilename = formatFilename;
const addPrefix = (filename, prefixes) => {
    let finalPrefix = ``;
    if (!prefixes || prefixes.length === 0)
        return exports.formatFilename(filename);
    finalPrefix = `${exports.formatFilename(filename)}`;
    for (let i = 0; i < prefixes.length; ++i) {
        if (prefixes[i])
            finalPrefix = `${finalPrefix}::${prefixes[i]}`;
    }
    return finalPrefix;
};
exports.addPrefix = addPrefix;
exports.factory = typescript_logging_1.LFService.createNamedLoggerFactory('ChainEvents', options);
const control = typescript_logging_1.getLogControl();
// Factories are numbered, use listFactories() to find out
exports.factoryControl = control.getLoggerFactoryControl(0);
// Change the loglevel for all LogGroups for this factory to Debug
// (so all existing/new loggers from this factory will log to Debug)
const logLevel = process.env.NODE_ENV !== 'production' ? 'Debug' : 'Info';
exports.factoryControl.change({ group: 'all', logLevel });
//# sourceMappingURL=logging.js.map