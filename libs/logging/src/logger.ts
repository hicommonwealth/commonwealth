import { GetLogger, ILogger, LoggerIds } from './interfaces';
import { getDefaultLogger } from './util/getDefaultLogger';

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
