import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import axios from 'axios';
import type { Request, Response } from 'express';

const log = logger(import.meta);

export function cosmosMagicOptionsHandler(_req: Request, res: Response): void {
  res.header('Access-Control-Allow-Origin', 'https://auth.magic.link');
  res.header('Access-Control-Allow-Private-Network', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With',
  );
  res.sendStatus(200);
}

export async function cosmosMagicNodeInfoProxyHandler(
  req: Request,
  res: Response,
) {
  // always use cosmoshub for simplicity
  const chainNode = await models.ChainNode.findOne({
    where: { cosmos_chain_id: 'cosmoshub' },
  });
  const targetRestUrl = chainNode?.alt_wallet_url;
  const targetRpcUrl = chainNode?.url;

  try {
    if (req.method !== 'POST') return res.send();

    const response = await axios.get(targetRestUrl + '/node_info', {
      headers: {
        origin: `https://${PRODUCTION_DOMAIN}/?magic_login_proxy=true`,
      },
    });

    // magicCosmosAPI is CORS-approved for the magic iframe
    res.setHeader('Access-Control-Allow-Origin', 'https://auth.magic.link');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    return res.send(response.data);
  } catch (err) {
    log.error('Error', err, { targetRestUrl, targetRpcUrl });
    res.status(500).json({ message: err.message });
  }
}
