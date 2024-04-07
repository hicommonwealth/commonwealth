import { getDefaultLogger } from './defaultLogger';
import { GetLogger, ILogger, LoggerIds } from './interfaces';

// Unified function implementation
export function logger(
  ids: string | LoggerIds,
  getLogger?: GetLogger,
): ILogger {
  if (!Array.isArray(ids)) ids = [ids];

  if (getLogger) {
    return getLogger(ids);
  } else {
    return getDefaultLogger(ids);
  }
}
