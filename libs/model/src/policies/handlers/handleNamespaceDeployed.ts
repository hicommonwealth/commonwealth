import { EventHandler, logger } from '@hicommonwealth/core';
import { ZodUndefined } from 'zod';

const log = logger(import.meta);

export const handleNamespaceDeployed: EventHandler<
  'NamespaceDeployed',
  ZodUndefined
  // eslint-disable-next-line @typescript-eslint/require-await
> = async ({ payload: _ }) => {
  log.info('NamespaceDeployed event implementation not defined');
};
