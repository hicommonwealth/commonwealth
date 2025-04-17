import { command, EventHandler } from '@hicommonwealth/core';
import { ZodUndefined } from 'zod';
import { LinkNamespace } from '../../aggregates/community';
import { systemActor } from '../../middleware';

export const handleNamespaceDeployed: EventHandler<
  'NamespaceDeployed',
  ZodUndefined
> = async ({ payload }) => {
  const { nameSpaceAddress, _namespaceDeployer } = payload.parsedArgs;

  await command(LinkNamespace(), {
    actor: systemActor({}),
    payload: {
      namespace_address: nameSpaceAddress,
      deployer_address: _namespaceDeployer,
      log_removed: payload.rawLog.removed,
    },
  });
};
