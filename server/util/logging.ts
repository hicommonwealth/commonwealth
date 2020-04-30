import {
  LoggerFactory,
  LoggerFactoryOptions,
  LFService,
  LogGroupRule,
  LogLevel
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
