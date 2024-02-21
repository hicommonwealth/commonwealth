import type { CommandMetadata } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';
import { mustExist } from '../middleware/guards';
import type { CommunityAttributes } from '../models';
import { commonProtocol } from '../services';

export const schema = z.object({
  namespace: z.string(),
  txHash: z.string(),
  address: z.string(),
});

export const UpdateCommunity = (): CommandMetadata<
  CommunityAttributes,
  typeof schema
> => ({
  schema,
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
