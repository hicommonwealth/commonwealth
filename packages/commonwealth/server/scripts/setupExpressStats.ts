// Adapted from:
// https://github.com/uber-archive/express-statsd/blob/master/lib/express-statsd.js

import { ProjectTag, StatsDController } from '@hicommonwealth/core';
import type { NextFunction, Request, Response } from 'express';

export default function expressStatsdInit() {
  return function expressStatsd(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const startTime = new Date().getTime();

    // Function called on response finish that sends stats to statsd
    function sendStats() {
      // Status Code
      const statusCode = res.statusCode.toString() || 'unknown_status';
      const tags = {
        statusCode,
        method: req.method,
        path: req.path,
        project: ProjectTag.Commonwealth,
      };

      // Response Time
      const duration = new Date().getTime() - startTime;
      StatsDController.get().timing('express.response_time', duration, tags);

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
