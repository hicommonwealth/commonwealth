import Rollbar from 'rollbar';
import { ROLLBAR_ENV, ROLLBAR_SERVER_TOKEN } from './config';

export const rollbar = new Rollbar({
  accessToken: ROLLBAR_SERVER_TOKEN,
  environment: ROLLBAR_ENV,
  captureUncaught: true,
  captureUnhandledRejections: true,
});
