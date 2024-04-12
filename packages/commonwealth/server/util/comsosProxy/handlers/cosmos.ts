import { NodeHealth } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { ChainNodeInstance, models } from '@hicommonwealth/model';
import axios from 'axios';
import type { Request, Response } from 'express';
import {
  queryExternalProxy,
  updateNodeHealthIfNeeded,
  upgradeBetaNodeIfNeeded,
} from '../utils';

const log = logger(__filename);

const FALLBACK_NODE_DURATION = +process.env.FALLBACK_NODE_DURATION_S || 300;

export async function cosmosHandler(
  requestType: 'REST' | 'RPC',
  req: Request,
  res: Response,
) {
  const community = await models.Community.findOne({
    where: { id: req.params.community_id },
    include: {
      model: models.ChainNode.scope('withPrivateData'),
      required: true,
    },
  });

  if (!community) {
    throw new Error(`Invalid community id: ${req.params.community_id}`);
  }

  const nodeTimeoutEnd = new Date(
    community.ChainNode.updated_at.getTime() + FALLBACK_NODE_DURATION,
  );

  if (
    community.ChainNode.alt_wallet_url &&
    (community.ChainNode.health === NodeHealth.Healthy ||
      (community.ChainNode.health === NodeHealth.Failed &&
        new Date() > nodeTimeoutEnd))
  ) {
    const url =
      requestType === 'REST'
        ? community.ChainNode.alt_wallet_url?.trim()
        : community.ChainNode.private_url?.trim() ||
          community.ChainNode.url?.trim();

    try {
      const response = await axios.post(url, req.body, {
        headers: {
          origin: 'https://commonwealth.im',
        },
      });

      await updateNodeHealthIfNeeded(
        req,
        community.ChainNode as ChainNodeInstance,
        {
          response,
        },
      );

      if (requestType === 'RPC') {
        await upgradeBetaNodeIfNeeded(
          req,
          response,
          community.ChainNode as ChainNodeInstance,
        );
      }

      return res.send(response.data);
    } catch (err) {
      log.error('Failed to query internal Cosmos chain node', err, {
        chainNode: community?.ChainNode,
      });
      await updateNodeHealthIfNeeded(
        req,
        community.ChainNode as ChainNodeInstance,
        {
          error: err,
        },
      );
    }
  }

  const response = await queryExternalProxy(
    req,
    requestType,
    community.ChainNode as ChainNodeInstance,
  );
  return res.send(response?.data);
}
