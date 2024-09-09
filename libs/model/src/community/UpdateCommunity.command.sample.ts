import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { commonProtocol } from '../services';

export function UpdateCommunity(): Command<typeof schemas.UpdateCommunity> {
  return {
    ...schemas.UpdateCommunity,
    auth: [],
    body: async ({ payload }) => {
      const community = await models.Community.findOne({
        where: { id: payload.id },
      });

      mustExist('Community', community);

      const namespaceAddress =
        await commonProtocol.newNamespaceValidator.validateNamespace(
          payload.namespace,
          payload.txHash,
          payload.address,
          community,
        );

      community.namespace = payload.namespace;
      community.namespace_address = namespaceAddress;
      return (await community.save()).get({ plain: true });
    },
  };
}
