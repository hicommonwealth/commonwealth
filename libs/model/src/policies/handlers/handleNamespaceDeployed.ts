import { command, EventHandler } from '@hicommonwealth/core';
import { ZodUndefined } from 'zod';
import { CreateNamespaceAdminGroup } from '../../aggregates/community/CreateNamespaceAdminGroup.command';
import { systemActor } from '../../middleware';

export const handleNamespaceDeployed: EventHandler<
  'NamespaceDeployed',
  ZodUndefined
  // eslint-disable-next-line @typescript-eslint/require-await
> = async ({ payload }) => {
  const { nameSpaceAddress } = payload.parsedArgs;

  await command(CreateNamespaceAdminGroup(), {
    actor: systemActor({}),
    payload: {
      namespace_address: nameSpaceAddress,
    },
  });
};
