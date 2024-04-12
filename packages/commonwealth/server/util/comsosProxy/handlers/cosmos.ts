import { NodeHealth } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { ChainNodeInstance, models } from '@hicommonwealth/model';
import axios from 'axios';
import type { Request, Response } from 'express';
import _ from 'lodash';
import {
  IGNORE_COSMOS_CHAIN_IDS,
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
    !community.ChainNode.health ||
    community.ChainNode.health === NodeHealth.Healthy ||
    (community.ChainNode.health === NodeHealth.Failed &&
      new Date() > nodeTimeoutEnd)
  ) {
    let url: string;
    console.log(
      '\noriginalUrl',
      req.originalUrl,
      '\nbaseUrl',
      req.baseUrl,
      '\nurl',
      req.url,
    );
    if (requestType === 'REST' && community.ChainNode.alt_wallet_url) {
      url = req.originalUrl.replace(
        req.baseUrl,
        // remove trailing slash
        community.ChainNode.alt_wallet_url.trim().replace(/\/$/, ''),
      );
    } else if (requestType === 'RPC') {
      url =
        community.ChainNode.private_url?.trim() ||
        community.ChainNode.url?.trim();
    }

    if (!url) {
      log.error('No URL found for chain node', undefined, {
        cosmos_chain_id: community?.ChainNode.cosmos_chain_id,
      });
      throw new Error('No URL found for chain node');
    }

    try {
      const response = await axios.post(
        url,
        _.isEmpty(req.body) ? null : req.body,
        {
          headers: {
            origin: 'https://commonwealth.im',
          },
        },
      );

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
        requestType,
        cosmos_chain_id: community?.ChainNode.cosmos_chain_id,
      });
      await updateNodeHealthIfNeeded(
        req,
        community.ChainNode as ChainNodeInstance,
        {
          error: err,
        },
      );

      if (
        IGNORE_COSMOS_CHAIN_IDS.includes(community.ChainNode.cosmos_chain_id)
      ) {
        log.warn('Ignoring external proxy request for dev Cosmos chain', {
          cosmos_chain_id: community.ChainNode.cosmos_chain_id,
        });
        return res.status(err?.response?.status || 500).json({
          message: err?.message,
        });
      }
    }
  }

  try {
    const response = await queryExternalProxy(
      req,
      requestType,
      community.ChainNode as ChainNodeInstance,
    );

    if (!response)
      return res
        .status(500)
        .json({ message: 'External proxy request not supported' });

    return res.status(response.status || 200).send(response?.data);
  } catch (err) {
    log.error('Failed to query external Cosmos proxy', err, {
      chainNode: community?.ChainNode.cosmos_chain_id,
    });
    return res.status(err?.response?.status || 500).json({
      message: err?.message || 'Failed to query external Cosmos proxy',
    });
  }
}
