import {
  LoggerFactoryOptions,
  LFService,
  LogGroupRule,
  LogLevel,
  getLogControl,
  LogGroupControlSettings,
} from 'typescript-logging';

const options = new LoggerFactoryOptions()
  .addLogGroupRule(new LogGroupRule(new RegExp('model.+'), LogLevel.Debug))
  .addLogGroupRule(new LogGroupRule(new RegExp('route.+'), LogLevel.Debug))
  .addLogGroupRule(new LogGroupRule(new RegExp('.+'), LogLevel.Info));

export const formatFilename = (name: string): string => {
  const t = name.split('/');
  return t[t.length - 1];
};

export const addPrefix = (filename: string, prefixes?: string[]): string => {
  let finalPrefix = ``;
  if (!prefixes || prefixes.length === 0) return formatFilename(filename);
  finalPrefix = `${formatFilename(filename)}`;

  for (let i = 0; i < prefixes.length; ++i) {
    if (prefixes[i]) finalPrefix = `${finalPrefix}::${prefixes[i]}`;
  }
  return finalPrefix;
};

export const factory = LFService.createNamedLoggerFactory(
  'ChainEvents',
  options
);

const control = getLogControl();

// Factories are numbered, use listFactories() to find out
export const factoryControl = control.getLoggerFactoryControl(0);

// Change the loglevel for all LogGroups for this factory to Debug
// (so all existing/new loggers from this factory will log to Debug)
const logLevel = process.env.NODE_ENV !== 'production' ? 'Debug' : 'Info';
factoryControl.change({ group: 'all', logLevel } as LogGroupControlSettings);
