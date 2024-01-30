import { Logger } from '@hicommonwealth/core';
import type { LogGroupControlSettings } from 'typescript-logging';
import {
  LFService,
  LogGroupRule,
  LogLevel,
  LoggerFactoryOptions,
  getLogControl,
} from 'typescript-logging';
import { rollbar } from '../rollbar';

const options = new LoggerFactoryOptions()
  .addLogGroupRule(new LogGroupRule(new RegExp('model.+'), LogLevel.Debug))
  .addLogGroupRule(new LogGroupRule(new RegExp('route.+'), LogLevel.Debug))
  .addLogGroupRule(new LogGroupRule(new RegExp('.+'), LogLevel.Info));
const control = getLogControl();
const loggerFactory = LFService.createNamedLoggerFactory(
  'Commonwealth',
  options,
);

// Factories are numbered, use listFactories() to find out
const factoryControl = control.getLoggerFactoryControl(0);
// Change the loglevel for all LogGroups for this factory to Debug
// (so all existing/new loggers from this factory will log to Debug)
const logLevel = process.env.NODE_ENV !== 'production' ? 'Debug' : 'Info';
factoryControl.change({
  group: 'all',
  logLevel,
} as LogGroupControlSettings);

const formatFilename = (name) => {
  const t = name.split('/');
  return t[t.length - 1];
};

const addPrefix = (filename: string, prefixes?: string[]) => {
  let finalPrefix = ``;
  if (!prefixes || prefixes.length === 0) return formatFilename(filename);
  else finalPrefix = `${formatFilename(filename)}`;
  for (let i = 0; i < prefixes.length; ++i) {
    if (prefixes[i]) finalPrefix = `${finalPrefix}::${prefixes[i]}`;
  }
  return finalPrefix;
};

export const TypescriptLoggingLogger = (): Logger => ({
  name: 'TypescriptLoggingLogger',
  dispose: () => Promise.resolve(),
  getLogger: (filename: string, ...ids: string[]) => {
    const logger = loggerFactory.getLogger(addPrefix(filename, ids));
    return {
      trace(msg: string, error?: Error) {
        logger.trace(msg, error);
      },
      debug(msg: string, error?: Error) {
        logger.debug(msg, error);
      },
      info(msg: string, error?: Error) {
        logger.info(msg, error);
      },
      warn(msg: string, error?: Error) {
        logger.warn(msg, error);
      },
      error(msg: string, error?: Error) {
        logger.error(msg, error);
        rollbar.error(msg, error);
      },
      fatal(msg: string, error?: Error) {
        logger.fatal(msg, error);
        rollbar.critical(msg, error);
      },
    };
  },
});
