// Adapted from:
// https://github.com/uber-archive/express-statsd/blob/master/lib/express-statsd.js

import { StatsD } from 'hot-shots';
import { Request, Response, NextFunction } from 'express';

export default function expressStatsdInit (client: StatsD) {
  return function expressStatsd (req: Request, res: Response, next: NextFunction) {
    const startTime = new Date().getTime();

    // Function called on response finish that sends stats to statsd
    function sendStats() {
      const stat = (req.method + req.path).toLowerCase()
        .replace(/[:.]/g, '')
        .replace(/\//g, '.')

      // Status Code
      const statusCode = res.statusCode || 'unknown_status';
      const statusKey = `express.${stat}.status_code.${statusCode}`
      client.increment(statusKey);

      // Response Time
      const duration = new Date().getTime() - startTime;
      const durationKey = `express.${stat}.response_time`;
      client.timing(durationKey, duration);

      // console.log(`SENDING STATS: ${statusKey} + ${durationKey}: ${duration}`);

      // eslint-disable-next-line no-use-before-define
      cleanup();
    }

    // Function to clean up the listeners we've added
    function cleanup() {
      res.removeListener('finish', sendStats);
      res.removeListener('error', cleanup);
      res.removeListener('close', cleanup);
    }

    // Add response listeners
    res.once('finish', sendStats);
    res.once('error', cleanup);
    res.once('close', cleanup);

    if (next) {
      next();
    }
  };
}
