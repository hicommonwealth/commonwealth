import type { LogGroupControlSettings, Logger } from 'typescript-logging';
import {
  LFService,
  LogGroupRule,
  LogLevel,
  LoggerFactoryOptions,
  getLogControl,
} from 'typescript-logging';

// TODO: Is this the port interface?
export interface ILogger extends Logger {}

const options = new LoggerFactoryOptions()
  .addLogGroupRule(new LogGroupRule(new RegExp('model.+'), LogLevel.Debug))
  .addLogGroupRule(new LogGroupRule(new RegExp('route.+'), LogLevel.Debug))
  .addLogGroupRule(new LogGroupRule(new RegExp('.+'), LogLevel.Info));

export const formatFilename = (name) => {
  const t = name.split('/');
  return t[t.length - 1];
};

export const addPrefix = (filename: string, prefixes?: string[]) => {
  let finalPrefix = ``;
  if (!prefixes || prefixes.length === 0) return formatFilename(filename);
  else finalPrefix = `${formatFilename(filename)}`;

  for (let i = 0; i < prefixes.length; ++i) {
    if (prefixes[i]) finalPrefix = `${finalPrefix}::${prefixes[i]}`;
  }
  return finalPrefix;
};

export const loggerFactory = LFService.createNamedLoggerFactory(
  'Commonwealth',
  options,
);

const control = getLogControl();

// Factories are numbered, use listFactories() to find out
const factoryControl = control.getLoggerFactoryControl(0);

// Change the loglevel for all LogGroups for this factory to Debug
// (so all existing/new loggers from this factory will log to Debug)
const logLevel = process.env.NODE_ENV !== 'production' ? 'Debug' : 'Info';
factoryControl.change({ group: 'all', logLevel } as LogGroupControlSettings);
