// eslint-disable-next-line import/no-cycle
import { config } from '@hicommonwealth/core';
import Rollbar from 'rollbar';

export const rollbar = new Rollbar({
  accessToken: config.LOGGING.ROLLBAR_SERVER_TOKEN,
  environment: config.LOGGING.ROLLBAR_ENV,
  captureUncaught: true,
  captureUnhandledRejections: true,
});
