import { config as target } from '@hicommonwealth/adapters';

const { PORT, SL_PORT } = process.env;

export const config = {
  ...target,
  PORT:
    target.APP_ENV === 'local' || target.APP_ENV === 'CI'
      ? parseInt(SL_PORT ?? '8001', 10)
      : parseInt(PORT, 10),
};
