import { type Command } from '@hicommonwealth/core';
import { commands } from '@hicommonwealth/shared';
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';
import { mustExist } from '../middleware/guards';
import { commonProtocol } from '../services';

export const UpdateCommunity: Command<
  typeof commands.UpdateCommunity
> = () => ({
  ...commands.UpdateCommunity,
  auth: [isCommunityAdmin],
  body: async ({ id, payload }) => {
    const community = await models.Community.findOne({ where: { id } });

    if (!mustExist('Community', community)) return;

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
});
