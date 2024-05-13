import * as dotenv from 'dotenv';
import Rollbar from 'rollbar';

dotenv.config();

const ROLLBAR_SERVER_TOKEN = process.env.ROLLBAR_SERVER_TOKEN || '';
const ROLLBAR_ENV = process.env.ROLLBAR_ENV || 'local';

export const rollbar = new Rollbar({
  accessToken: ROLLBAR_SERVER_TOKEN,
  environment: ROLLBAR_ENV,
  captureUncaught: true,
  captureUnhandledRejections: true,
});
