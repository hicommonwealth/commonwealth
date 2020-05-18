import {
  LoggerFactory,
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

export const formatFilename = (name) => {
  const t = name.split('/');
  return t[t.length - 1];
};

export const factory = LFService.createNamedLoggerFactory('LoggerFactory', options);

const control = getLogControl();

// Factories are numbered, use listFactories() to find out
const factoryControl = control.getLoggerFactoryControl(0);

// Change the loglevel for all LogGroups for this factory to Debug
// (so all existing/new loggers from this factory will log to Debug)
const DEV = process.env.NODE_ENV !== 'production';
factoryControl.change({ group: 'all', logLevel: DEV ? 'Debug' : 'Info' } as LogGroupControlSettings);
