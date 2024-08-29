import Rollbar from 'rollbar';
import { config } from '../config';

export const rollbar = new Rollbar({
  accessToken: config.LOGGING.ROLLBAR_SERVER_TOKEN,
  environment: config.LOGGING.ROLLBAR_ENV,
  captureUncaught: true,
  captureUnhandledRejections: true,
});
