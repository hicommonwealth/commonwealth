import { EventHandler, logger } from '@hicommonwealth/core';
import { ZodUndefined } from 'zod';

const log = logger(import.meta);

export const handleNamespaceDeployed: EventHandler<
  'NamespaceDeployed',
  ZodUndefined
> = async ({ payload }) => {
  log.info('NamespaceDeployed event implementation not defined');
};
