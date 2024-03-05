import { CommandMetadata, community } from '@hicommonwealth/core';
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';
import { mustExist } from '../middleware/guards';
import { commonProtocol } from '../services';

export const UpdateCommunity = (): CommandMetadata<
  typeof community.UpdateCommunity
> => ({
  schemas: community.UpdateCommunity,
  auth: [isCommunityAdmin],
  body: async ({ id, payload }) => {
    const community = await models.Community.findOne({ where: { id } });

    if (!mustExist('Community', community)) return;

    await commonProtocol.newNamespaceValidator.validateNamespace(
      payload.namespace,
      payload.txHash,
      payload.address,
      community,
    );

    community.namespace = payload.namespace;
    return (await community.save()).get({ plain: true });
  },
});
