import { config as target } from '@hicommonwealth/adapters';

const { PORT } = process.env;

export const config = {
  ...target,
  PORT: parseInt(PORT ?? '8001', 10),
};
