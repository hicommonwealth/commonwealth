export const Environments = [
  'development',
  'test',
  'staging',
  'production',
] as const;
export type Environment = typeof Environments[number];

export const LogLevels = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
] as const;
export type LogLevel = typeof LogLevels[number];

export const ExitCodes = ['UNIT_TEST', 'ERROR', 'EXIT'] as const;
/**
 * Application exit codes
 * - `UNIT_TEST` to flag unit tests, avoiding process exits on errors
 * - `ERROR` exit on errors
 * - `EXIT` normal exit signal
 */
export type ExitCode = typeof ExitCodes[number];
