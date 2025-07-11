import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { ChainNodeInstance } from '@hicommonwealth/model/models';
import { NodeHealth, PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import axios from 'axios';
import type { Request, Response } from 'express';
import _ from 'lodash';
import {
  IGNORE_COSMOS_CHAIN_IDS,
  queryExternalProxy,
  updateNodeHealthIfNeeded,
  updateSlip44IfNeeded,
  updateV1NodeIfNeeded,
  upgradeBetaNodeIfNeeded,
} from '../utils';

const log = logger(import.meta);

// @ts-expect-error StrictNullChecks
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

  await updateSlip44IfNeeded(community.ChainNode as ChainNodeInstance);

  const nodeTimeoutEnd = new Date(
    // @ts-expect-error StrictNullChecks
    community.ChainNode.updated_at.getTime() + FALLBACK_NODE_DURATION,
  );

  if (
    !community.ChainNode!.health ||
    community.ChainNode!.health === NodeHealth.Healthy ||
    (community.ChainNode!.health === NodeHealth.Failed &&
      new Date() > nodeTimeoutEnd)
  ) {
    let url: string;
    if (requestType === 'REST' && community.ChainNode!.alt_wallet_url) {
      url = req.originalUrl.replace(
        req.baseUrl,
        // remove trailing slash
        community.ChainNode!.alt_wallet_url.trim().replace(/\/$/, ''),
      );
    } else if (requestType === 'RPC') {
      url =
        community.ChainNode!.private_url?.trim() ||
        community.ChainNode!.url?.trim();
    }

    // @ts-expect-error StrictNullChecks
    if (!url) {
      log.error('No URL found for chain node', undefined, {
        cosmos_chain_id: community.ChainNode!.cosmos_chain_id,
      });
      throw new Error('No URL found for chain node');
    }

    try {
      const response = await axios.post(
        url,
        _.isEmpty(req.body) ? null : req.body,
        {
          headers: {
            origin: `https://${PRODUCTION_DOMAIN}`,
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
      } else if (requestType === 'REST') {
        await updateV1NodeIfNeeded(
          req,
          community.ChainNode as ChainNodeInstance,
        );
      }
      return res.send(response.data);
    } catch (err) {
      log.error('Failed to query internal Cosmos chain node', err, {
        requestType,
        // @ts-expect-error StrictNullChecks
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
        // @ts-expect-error StrictNullChecks
        IGNORE_COSMOS_CHAIN_IDS.includes(community.ChainNode.cosmos_chain_id)
      ) {
        log.warn('Ignoring external proxy request for dev Cosmos chain', {
          // @ts-expect-error StrictNullChecks
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
      // @ts-expect-error StrictNullChecks
      chainNode: community?.ChainNode.cosmos_chain_id,
    });
    return res.status(err?.response?.status || 500).json({
      message: err?.message || 'Failed to query external Cosmos proxy',
    });
  }
}
